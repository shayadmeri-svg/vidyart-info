#!/usr/bin/env python3
"""Validate static VidyaRT SEO, schema, links, and image assets (stdlib only).
Usage: python3 tools/check-seo.py [site-directory]
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, re, sys, xml.etree.ElementTree as ET

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids=[]; self.links=[]; self.images=[]; self.meta={}; self.canonical=[]
        self.h1=0; self.title=''; self.schema=[]; self.in_title=False; self.in_schema=False
        self.schema_text=''; self.text=[]; self.feed(text)
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag=='html': self.lang=a.get('lang')
        if tag=='h1': self.h1+=1
        if tag=='title': self.in_title=True
        if tag=='meta': self.meta[a.get('name',a.get('property',''))]=a.get('content','')
        if tag=='link' and a.get('rel')=='canonical': self.canonical.append(a.get('href',''))
        if tag in ['a','link'] and a.get('href'): self.links.append(a['href'])
        if tag in ['img','script','source'] and a.get('src'): self.links.append(a['src'])
        if tag=='img':
            self.images.append(a)
            for v in a.get('srcset','').split(','):
                if v.strip(): self.links.append(v.strip().split()[0])
        if tag=='script' and a.get('type')=='application/ld+json': self.in_schema=True;self.schema_text=''
    def handle_endtag(self,tag):
        if tag=='title': self.in_title=False
        if tag=='script' and self.in_schema:
            self.schema.append(json.loads(self.schema_text));self.in_schema=False
    def handle_data(self,data):
        if self.in_title: self.title+=data
        if self.in_schema: self.schema_text+=data
        else: self.text.append(data)

root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]
errors=[]
def check(ok,msg):
    if not ok: errors.append(msg)
pages={}
def parse(path):
    if path not in pages: pages[path]=Page(path.read_text())
    return pages[path]

urls=[x.text for x in ET.parse(root/'sitemap.xml').findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
host=(root/'CNAME').read_text().strip()
titles=set();descriptions=set()
for url in urls:
    u=urlsplit(url);rel=u.path.lstrip('/') or 'index.html';file=root/rel
    check(u.scheme=='https' and u.netloc==host, f'Wrong sitemap host: {url}')
    check(file.is_file(), f'Missing sitemap page: {rel}')
    if not file.is_file(): continue
    p=parse(file);label=file.name
    check(p.h1==1, f'{label}: expected one H1, got {p.h1}')
    check(p.canonical==[url], f'{label}: canonical mismatch')
    check(p.lang=='en-IN', f'{label}: missing language')
    check(len(p.ids)==len(set(p.ids)),f'{label}: duplicate IDs')
    check(p.title not in titles,f'{label}: duplicate title');titles.add(p.title)
    desc=p.meta.get('description','')
    check(90<=len(desc)<=180, f'{label}: review description length {len(desc)}')
    check(desc not in descriptions,f'{label}: duplicate description');descriptions.add(desc)
    check('noindex' not in p.meta.get('robots',''), f'{label}: noindex on public page')
    for key in ['og:title','og:description','og:image','og:image:alt','twitter:card','twitter:title','twitter:description','twitter:image']:
        check(bool(p.meta.get(key)),f'{label}: missing {key}')
    check(p.meta.get('og:url')==url,f'{label}: OG URL mismatch')
    for image in p.images:
        check('alt' in image,f'{label}: image missing alt')
        if image.get('src','').startswith('images/'):
            check(bool(image.get('width') and image.get('height')),f'{label}: image missing dimensions')
            check(bool(image.get('srcset')),f'{label}: image missing responsive sources')
    graph=[node for s in p.schema for node in s.get('@graph',[])]
    types={n.get('@type') for n in graph}
    check({'Organization','WebSite','WebApplication'}.issubset(types),f'{label}: missing entity schema')
    if rel!='index.html': check('BreadcrumbList' in types,f'{label}: missing breadcrumb schema')
    normalize=lambda x: re.sub(r'\s+',' ',x).strip()
    visible=normalize(' '.join(p.text))
    for node in graph:
        if node.get('@type')=='FAQPage':
            for q in node.get('mainEntity',[]):
                check(normalize(q['name']) in visible,f'{label}: FAQ question absent from HTML')
                check(normalize(q['acceptedAnswer']['text']) in visible,f'{label}: FAQ answer differs from HTML')
    for href in p.links:
        link=urlsplit(href)
        if link.scheme in ['mailto','tel','data'] or (link.netloc and link.netloc!=host): continue
        path=unquote(link.path)
        target=(root/path.lstrip('/')) if path.startswith('/') else file.parent/path
        if not path: target=file
        if target.is_dir(): target=target/'index.html'
        check(target.exists(),f'{label}: broken local link {href}')
        if target.is_file() and target.suffix=='.html' and link.fragment:
            check(unquote(link.fragment) in parse(target).ids,f'{label}: missing anchor {href}')

robots=(root/'robots.txt').read_text()
check('Disallow: /\n' not in robots,'Public site blocks all crawling')
check(f'Sitemap: https://{host}/sitemap.xml' in robots,'Wrong sitemap in robots.txt')
check((root/'llms.txt').exists(),'Missing guide directory for AI readers')
check('noindex' in parse(root/'404.html').meta.get('robots',''),'404 page should be noindex')
if errors:
    print('\n'.join(errors));sys.exit(1)
print(f'PASS: {len(urls)} indexable pages; canonical URLs, unique metadata, structured data, FAQ parity, links, images, and crawler files.')
