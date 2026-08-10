# Content review before launch

The migration preserves the public WordPress content exactly. These items require an editorial or business decision before the new site replaces it.

## Catalogue decisions

- **Beach Sun Cumbuco is duplicated:** post IDs `2108` and `2578` share the same title, coordinates, size, room counts, and lead image. Treat them as separate legacy URLs until we confirm whether they represent different units. The second record has only one gallery image.
- **Name and URL mismatch:** `/properties/villa-priscila/` displays the title “Casa Viviana”. Keep the URL for SEO, but confirm the preferred public name.
- **Availability is incomplete:** only Villa Branca, Dunas Village, and Dream Village 401-H contain reserved dates. Empty dates must not be presented as confirmed availability.
- **Small galleries:** Beach Sun Cumbuco has four images and its duplicate has one. These should be expanded or consolidated before launch.

## Editorial decisions

- Property descriptions contain original grammar, spelling, pricing, and service statements. They need a structured editorial pass rather than automatic rewriting.
- The home export is largely theme/footer marketing copy and should be replaced with a concise, purpose-written homepage.
- The Cumbuco destination archive has a URL but no dedicated page export; it needs original destination content.
- Contact data is preserved, but the new form delivery service and spam protection are still undecided.

## Legal and privacy decisions

- Terms and cancellation wording must be confirmed against the current business policy.
- The privacy page describes the old WordPress site and Google Analytics implementation. It must be rewritten to match the actual Cloudflare site, analytics, cookies, form processing, and applicable privacy requirements.

None of these issues block interface development, but they block final production sign-off.
