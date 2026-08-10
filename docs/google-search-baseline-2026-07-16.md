# Google Search baseline — 16 July 2026

This is the production baseline for the WordPress-to-Cloudflare migration. Compare future Search Console and PageSpeed results with these figures before changing URLs, titles, or core page copy.

## Search Console

Property: `https://www.cumbuco.net/` (URL-prefix property)

- Last three months: 53 clicks, 3,250 impressions, 1.6% CTR, average position 9.4.
- Indexing: 25 indexed pages and 65 not indexed pages.
- Manual actions: none.
- Security issues: none.
- HTTPS: 24 HTTPS pages and no non-HTTPS pages.
- Breadcrumb enhancement: 24 valid, none invalid.
- Core Web Vitals: insufficient field data on both mobile and desktop.
- The homepage is indexed, served over HTTPS, and has a breadcrumb enhancement.

### Highest-traffic landing pages

| Page | Clicks | Impressions | CTR | Position |
| --- | ---: | ---: | ---: | ---: |
| `/` | 23 | 1,101 | 2.1% | 8.7 |
| `/properties/beach-sun-cumbuco/` | 8 | 546 | 1.5% | 8.0 |
| `/properties/villa-branca/` | 7 | 249 | 2.8% | 9.2 |
| `/properties/casa-maria-flor-cumbuco/` | 3 | 49 | 6.1% | 6.3 |
| `/properties/dunas-village/` | 2 | 217 | 0.9% | 7.6 |
| `/properties/` | 2 | 176 | 1.1% | 6.8 |
| `/about-us/` | 2 | 136 | 1.5% | 15.1 |
| `/properties/casa-vermelha/` | 2 | 94 | 2.1% | 7.4 |
| `/properties/casa-chick/` | 2 | 90 | 2.2% | 10.1 |
| `/properties/dream-village-302-v/` | 1 | 248 | 0.4% | 10.0 |

These URLs are migration-critical. Preserve them exactly or use a direct one-hop permanent redirect if a property is retired.

### Indexing cleanup

Search Console reports 41 pages as discovered but not indexed and 24 as crawled but not indexed. Most examples are legacy WordPress utility, taxonomy, filter, login, pagination, or removed-property URLs. Do not redirect every obsolete URL to the homepage; map only pages with a genuinely equivalent replacement and allow irrelevant utility URLs to disappear.

The 24 crawled examples include active property URLs as well as obsolete variants. Active canonical URLs must remain in the sitemap and internal navigation. Currency and display-mode query variants should resolve to their clean canonical URL.

### Sitemap submission

Search Console previously listed only the old `estate_property-sitemap.xml`, last read on 28 August 2024. The new `https://www.cumbuco.net/sitemap.xml` was submitted on 16 July 2026 and successfully read with 23 discovered pages. Retain the old submission during the initial monitoring period while Google processes the replacement.

## PageSpeed baseline

Measured against the production homepage on 16 July 2026.

| Metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance score | 75 | 98 |
| Accessibility | 95 | 95 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 2.9 s | 0.8 s |
| LCP | 5.4 s | 1.1 s |
| TBT | 0 ms | 0 ms |
| CLS | 0 | 0.027 |

The principal mobile findings were oversized images (about 1,058 KiB potential savings) and render-blocking resources (about 2,220 ms potential savings). The desktop accessibility report also found insufficient color contrast.

### First post-deployment measurement

Measured at 21:56 Europe/Copenhagen after deploying commit `f4a26c9`.

| Metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance score | 90 | 99 |
| Accessibility | 95 | 95 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |
| FCP | 2.9 s | 0.7 s |
| LCP | 2.9 s | 0.8 s |
| TBT | 0 ms | 0 ms |
| CLS | 0.048 | 0 |

Mobile image-delivery savings fell from about 1,058 KiB to 199 KiB. The remaining accessibility failure was traced to coral eyebrow text on the sand background; its measured color pair was just below the required contrast threshold and was darkened in the follow-up change.

### Final verification after the follow-up deployment

- Mobile: performance 90, accessibility 100, best practices 100, SEO 100; LCP 2.9 s and CLS 0.
- Desktop: performance 99, accessibility 100, best practices 100, SEO 100; LCP 0.8 s and CLS 0.027.
- Mobile image-delivery opportunity: about 180 KiB, down from the original 1,058 KiB.
- Desktop image-delivery opportunity: about 224 KiB, down from 1,586 KiB.

## Legacy URL policy

- Live content URLs retain their existing paths and automatically resolve to the canonical trailing-slash form.
- Obsolete WordPress `currency` and `mode` parameters are removed with a permanent redirect while unrelated tracking parameters are preserved.
- Removed properties with a relevant replacement keep direct permanent redirects in `_redirects`.
- Confirmed WordPress search, login, editing, calendar, widget, and retired taxonomy pages return `410 Gone` so crawlers can remove them without interpreting an irrelevant homepage redirect as a soft 404.
- The full 41-URL discovered-but-not-indexed inventory was reviewed. Alternate homepage templates redirect to `/`, alternate property-list layouts redirect to `/properties/`, and `/uber-uns/` redirects to `/about-us/`; the remaining account, payment, feed, demo, dashboard, shortcode, and utility pages return `410 Gone`.

## Link baseline

Search Console reports two external links, both to the homepage: one from `attracta.com` and one from `fortalezarealestate.com.br`. No retired WordPress URL has reported external link equity. Search Console reports 508 internal links, concentrated on the current canonical homepage, information pages, taxonomy pages, and property pages.

## Validation tracking

Search Console validation was started on 16 July 2026 for both legacy exclusion groups after the redirect and `410 Gone` rules were deployed:

- Discovered — currently not indexed: 41 affected URLs.
- Crawled — currently not indexed: 24 affected URLs.

Validation is expected to take time while Google recrawls the examples. Do not change the mapped responses during this process; monitor the validation detail reports and investigate any URL that fails.

## Immediate work order

1. Deploy the responsive hero, optimized property-card images, asynchronous font stylesheet, and accessible color adjustments.
2. Re-run mobile and desktop PageSpeed after Cloudflare deploys the commit; record the new scores here.
3. Monitor the successfully submitted `sitemap.xml` and confirm that its 23 discovered pages move through indexing as expected.
4. Verify the priority landing pages with URL Inspection and confirm their selected canonical URLs.
5. Build a deliberate legacy URL map from Search Console data, using direct redirects only where the replacement is relevant.
6. Review indexing, clicks, impressions, CTR, and average position daily for the first week, then weekly.
