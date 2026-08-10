# Cumbuco destination architecture

This document defines the Stage 2 information architecture and content model for expanding Cumbuco.net into a destination guide without reducing the prominence or SEO strength of vacation rentals.

## Permanent commercial guardrails

- Cumbuco Rentals remains the brand.
- Vacation rentals remain the primary commercial purpose.
- `Vacation Rentals` remains the first primary-navigation destination.
- Existing rental URLs are preserved.
- The homepage hero and first major content section remain rental-led.
- Destination content supports rental discovery rather than replacing it.
- Private property-owner margin arrangements are never explained publicly.

## Approved route architecture

The established `/city/cumbuco/` URL remains the destination hub.

```text
/
├── properties/
│   ├── listings/apartment/
│   ├── listings/house/
│   ├── listings/villa/
│   └── properties/{property-slug}/
├── city/cumbuco/
│   ├── where-to-stay/
│   ├── restaurants/
│   ├── things-to-do/
│   ├── beaches/
│   ├── kiteboarding/
│   └── travel-information/
├── list-your-property/
├── featured-partners/
├── about-us/
└── contact-cumbuco-rentals/
```

Stage 2 defines these routes but does not publish them. Publishing begins only when a page contains sufficiently useful, original content and passes metadata, internal-link, image, and mobile checks.

## Planned navigation

The Stage 3 navigation should follow this order:

1. Vacation Rentals
2. Cumbuco Guide
3. List Your Property
4. About
5. Contact

The Cumbuco Guide menu may expose the six destination sections. Business categories belong inside the guide rather than crowding the primary navigation.

## Guide collection

The `guides` collection stores editorial destination pages. Each record includes:

- Stable slug and intended route
- Publication status
- Topic
- Title, eyebrow, summary, and introduction
- Hero image with descriptive alt text and optional source/credit
- Ordered editorial sections
- Optional section images
- Related business categories
- Related guide slugs
- Featured state and display order
- SEO title, description, modified date, and social image

The route is stored explicitly so future refactoring cannot silently change a published URL.

## Business collection

The `businesses` collection supports restaurants, cafés, bars, hotels, pousadas, beach clubs, kite schools, shops, activities, transport providers, and visitor services.

Each record includes:

- Publication state
- Name, category, optional subcategory, and stable slug
- Short summary and full description
- One or more credited, accessible images
- Website, WhatsApp, telephone, email, and Google Maps links
- Area, optional street address, and optional coordinates
- Opening information, optional price range, and tags
- Featured Partner status and ordering priority
- Verification date
- SEO metadata

Featured Partner changes presentation and ordering only. It must not change factual editorial content, and listings must not be labelled as advertisements. No partnership pricing or private commercial agreement is stored publicly.

## Publishing rules

1. New content starts as `draft`.
2. Business contact and opening information must be verified before publication.
3. External links use HTTPS where available and open with `target="_blank" rel="noopener noreferrer"`.
4. Images require meaningful alt text. Image source and credit are retained when licensing requires attribution.
5. A business receives a standalone detail page only when enough unique content exists to avoid a thin page. Otherwise it appears as a structured card within the appropriate guide.
6. Guide pages link naturally to relevant rentals and back to the guide hub.
7. Rental pages may link to genuinely relevant guide material, but destination content must not interrupt the primary enquiry path.
8. `featuredPartner` is never used as a substitute for relevance.

## Structured-data mapping

Business categories map to suitable Schema.org types through `src/config/destination.ts`. The implementation must:

- Use the most precise supported type.
- Include only verified facts.
- Avoid aggregate ratings unless the source and rating count are displayed.
- Avoid fake review, price, or availability data.
- Use `ItemList` on category pages.
- Use `BreadcrumbList` on published guide and business-detail pages.

## Internal-link strategy

Every destination page should provide:

- A route back to `/city/cumbuco/`
- Links to two or more genuinely related guide pages when available
- A contextual route to `/properties/`
- Carefully selected rental links where accommodation context is relevant

The homepage should introduce destination content only after the featured-rental section. This protects the rental-first commercial hierarchy.

## Stage boundaries

- Stage 2: schemas, taxonomy, route plan, and publishing rules
- Stage 3: navigation and homepage evolution
- Stage 4: destination hub and practical travel guide
- Stage 5: guide clusters and editorial expansion
- Stage 6: business listings and Featured Partners
- Stage 7: final schema, internal links, metadata, and performance refinement
