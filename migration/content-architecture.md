# Content architecture

The new site keeps the valuable WordPress URLs during the rebuild. This avoids unnecessary SEO redirects and lets the interface be replaced independently of the content migration.

## Primary navigation

1. **Rentals** — `/properties/`
   - All rentals — `/properties/`
   - Apartments — `/listings/apartment/`
   - Houses — `/listings/house/`
   - Villas — `/listings/villa/`
2. **Cumbuco** — `/city/cumbuco/`
3. **About** — `/about-us/`
4. **Contact** — `/contact-cumbuco-rentals/`

Terms and privacy remain in the footer rather than the primary navigation.

## Page responsibilities

- **Home:** introduction, property discovery, accommodation types, destination value, and a clear enquiry path.
- **Rental index:** the complete active catalogue with useful filters; this replaces WordPress pagination.
- **Type archive:** a pre-filtered, crawlable subset of the catalogue.
- **Property detail:** gallery, key facts, description, amenities, map, availability context, and enquiry action.
- **Cumbuco guide:** evergreen destination information that supports visitors and organic search.
- **About:** company identity, local knowledge, and trust signals.
- **Contact:** direct contact details and the eventual enquiry form.
- **Legal:** reviewed terms and privacy information.

## Legacy-only routes

- `/action/apartment/` and `/action/entire-home/` remain recognized taxonomy URLs but are not shown in primary navigation.
- `/page/2/` permanently redirects to `/properties/` through Cloudflare Workers Static Assets.
- Every `/properties/<slug>/` URL remains unchanged.

## Content model

Each property has an explicit `propertyType` (`apartment`, `house`, or `villa`) and `rentalType` (`apartment` or `entire-home`) in addition to its untouched WordPress taxonomy. Descriptions are retained as both HTML and plain text. Every local gallery item keeps its WordPress source URL for provenance.

The navigation source of truth is `src/config/site.ts`. The property and page collection schemas are defined in `src/content.config.ts`.
