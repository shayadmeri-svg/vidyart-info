# VidyaRT student landing page

Static GitHub Pages site for `vidyart.info`. It is student-first and points students to the app at `https://app.vidyart.online/`; the For teachers navigation points to `https://vidyart.com/`.

The page is plain HTML and CSS. Preview by opening `index.html` or serving this directory with any static file server. Keep `CNAME` as `vidyart.info` when publishing. The page uses the supplied clean symbol SVG (`vidyart-logo.svg`) with transparent background and no pale flower plate. The earlier animated SVG is retained as `vidyart-animated.svg` for reference.


## Search and AI discovery update — 26 November 2026

All public content is static HTML and readable without JavaScript. New guides are linked from the home page and each other. Each page has a unique title and description, its own canonical URL, social preview metadata, and JSON-LD that matches the visible content. There are no invented reviews or ratings. FAQ markup describes visible questions; it does not promise a Google FAQ rich result.

Run the local validation from this folder:

```sh
python3 tools/check-seo.py
```

The validator checks sitemap coverage, canonical URLs, metadata, entity and breadcrumb schema, FAQ text, local links, image dimensions, and crawler configuration. The responsive WebP images have 640px and 1280px variants; the supplied originals remain available.

### Publishing and indexing

1. Publish this complete folder through the existing GitHub Pages workflow, including new HTML pages, `discover.css`, `scan.css`, `images/*.webp`, `.nojekyll`, `robots.txt`, `llms.txt`, and `sitemap.xml`. Preserve `CNAME`.
2. Verify the domain in Google Search Console and Bing Webmaster Tools with the actual account-provided verification method. No fabricated verification tokens are included.
3. Submit `https://vidyart.info/sitemap.xml` in each webmaster account after deployment. Inspect the homepage and new guide URLs for indexing eligibility.
4. Confirm the live canonical URLs return HTTP 200, missing URLs return 404, and any www/HTTP variants redirect to the canonical HTTPS hostname. GitHub Pages and CDN settings control redirects and response headers; local HTML cannot configure them.
5. Watch indexed pages, impressions, queries, and clicks. Use real query data to improve the guides and publish evidence from actual product use when available. Do not interpret indexing as a promise of ranking.

`llms.txt` is a supplementary directory of factual product information. It is not a ranking mechanism or a replacement for accessible HTML, internal links, and normal indexing. Search crawler access is explicit for OAI-SearchBot, Claude-SearchBot, and PerplexityBot; existing wildcard crawl access is retained. Training preferences have not been expanded.

Reference: [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features), [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies), and [OpenAI search crawler documentation](https://developers.openai.com/api/docs/bots).
