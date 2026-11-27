/*
 * Vidyart site analytics: Microsoft Clarity.
 * Drop in once per page, just before </body>:
 *   <script src="/vidyart-analytics.js" defer></script>
 *
 * What it tracks
 *  - Visits, heatmaps and session recordings (Clarity itself).
 *  - Campaign tags (utm_*) as Clarity tags, so you can filter recordings by campaign.
 *    They are kept for the visit and forwarded onto links to the app and the sister site,
 *    so a signup can be traced back to the ad or post it came from.
 *  - Clicks on signup, contact and plans links/buttons, as Clarity custom events.
 *    Add data-track="name" to any element to name its event yourself.
 */
(function () {
  'use strict';

  // ---- Clarity project per site (Clarity > Settings > Overview > Project ID) ----
  var CLARITY_IDS = {
    'vidyart.com': 'zkb05dsqvs',
    'vidyart.info': 'zkb0trz0ci'
  };
  // Links to these hosts count as signups (event name in the value).
  var APP_HOSTS = { 'app.vidyart.online': 'signup_student', 'admin.vidyart.online': 'signup_institute' };
  // Campaign tags are also carried across to the sister site.
  var SISTER_HOSTS = ['vidyart.com', 'www.vidyart.com', 'vidyart.info', 'www.vidyart.info'];
  // --------------------------------------------------------------------------

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
  var STORE = 'vidyart_utm';

  function safe(fn) { try { return fn(); } catch (e) { return null; } }

  // ---- campaign tags -------------------------------------------------------
  var params = new URLSearchParams(location.search);
  var utm = {};
  UTM_KEYS.forEach(function (k) { if (params.get(k)) utm[k] = params.get(k).slice(0, 100); });
  if (Object.keys(utm).length) safe(function () { sessionStorage.setItem(STORE, JSON.stringify(utm)); });
  else utm = safe(function () { return JSON.parse(sessionStorage.getItem(STORE) || '{}'); }) || {};

  // ---- Clarity ---------------------------------------------------------------
  var host = location.hostname.replace(/^www\./, '');
  var CLARITY_ID = CLARITY_IDS[host];
  var on = !!CLARITY_ID && CLARITY_ID !== 'REPLACE_ME';
  if (on) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
    Object.keys(utm).forEach(function (k) { window.clarity('set', k, utm[k]); });
    if (Object.keys(utm).length) window.clarity('set', 'campaign_visit', 'yes');
  }

  // ---- forward campaign tags onto app links ----------------------------------
  function appEvent(url) { return url && Object.prototype.hasOwnProperty.call(APP_HOSTS, url.hostname) ? APP_HOSTS[url.hostname] : null; }
  function decorate(a) {
    var url = safe(function () { return new URL(a.href, location.href); });
    if (!url || url.hostname === location.hostname) return;
    if (!appEvent(url) && SISTER_HOSTS.indexOf(url.hostname) === -1) return;
    var changed = false;
    Object.keys(utm).forEach(function (k) {
      if (!url.searchParams.has(k)) { url.searchParams.set(k, utm[k]); changed = true; }
    });
    if (changed) a.href = url.toString();
  }

  // ---- click events ----------------------------------------------------------
  function classify(el) {
    if (el.getAttribute('data-track')) return el.getAttribute('data-track');
    var href = (el.getAttribute('href') || '').toLowerCase();
    var text = (el.textContent || '').trim().toLowerCase();
    var url = href && safe(function () { return new URL(href, location.href); });
    if (/^(mailto:|tel:)/.test(href) || /wa\.me|whatsapp/.test(href) || /contact|demo|enquir|inquir/.test(href + ' ' + text)) return 'contact';
    if (appEvent(url)) return appEvent(url);
    if (/plans|pricing/.test(href + ' ' + text)) return 'plans';
    if (/sign ?up|register|get started|start free|try free/.test(text)) return 'signup';
    return null;
  }

  function track(name, el) {
    if (!on) return;
    var label = ((el.textContent || '').trim() || el.getAttribute('aria-label') || '').slice(0, 60);
    window.clarity('event', name + '_click');
    window.clarity('set', 'last_click', name + ': ' + label);
  }

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest && e.target.closest('a,button,[data-track]');
    if (!el) return;
    if (el.tagName === 'A') decorate(el);
    var name = classify(el);
    if (name) track(name, el);
  }, true);

  function decorateAll() { Array.prototype.forEach.call(document.querySelectorAll('a[href]'), decorate); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorateAll); else decorateAll();
})();
