# SEO launch checklist

The existing public URLs and search equity must be preserved during the move from WordPress/SiteGround to Cloudflare.

## Before changing the domain routes

- Export the last 16 months of Google Search Console performance data for queries, pages, countries, and devices.
- Record the currently indexed URLs and the top landing pages.
- Confirm that both `www.cumbuco.net` and `cumbuco.net` are attached to the Worker.
- Confirm that `https://cumbuco.net/*` returns one permanent redirect to the matching `https://www.cumbuco.net/*` URL.
- Test the active property URLs, legacy redirects, canonical tags, metadata, JSON-LD, `robots.txt`, and `sitemap.xml` on the production hostname.
- Keep the `workers.dev` preview hostname out of search results with `X-Robots-Tag: noindex, nofollow`.

## Launch

- Change only the hosting route; retain the same preferred `www.cumbuco.net` hostname and active URL paths.
- Do not remove the old SiteGround hosting immediately.
- Submit `https://www.cumbuco.net/sitemap.xml` in the existing Search Console property.
- Use URL Inspection for the homepage, property archive, About page, and several priority property pages.
- Confirm that Google can retrieve the pages and sees the declared canonical URLs.

## Monitor after launch

- Check Search Console indexing, crawl errors, Core Web Vitals, clicks, impressions, and average position daily during the first week and weekly afterward.
- Investigate every unexpected 404 and add a direct one-hop redirect when a relevant replacement exists.
- Keep permanent redirects for retired or renamed URLs for at least one year and preferably longer.
- Keep the old hosting available until traffic and crawl activity have fully moved to Cloudflare.
- Do not change titles, core copy, URLs, navigation, or domain settings again during the initial monitoring period unless correcting a verified problem.

## Pricing policy

No public rates are included in page copy or structured data. Quotes are prepared personally using the property, dates, number of nights, guests, season, and optional services.
