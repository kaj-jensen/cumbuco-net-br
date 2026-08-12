# cumbuco.net.br

Brazilian Portuguese Astro rebuild of the Cumbuco vacation-rentals website, deployed with Cloudflare Workers Static Assets.

Source of truth: `kaj-jensen/cumbuco-net-br`. The public WordPress site remains the production source until the Cloudflare migration is approved and verified.

## Local development

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
```

Cloudflare Workers Builds configuration:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Static asset directory: `dist` (configured in `wrangler.jsonc`)
- Node.js: 24

## Legacy migration

```sh
npm run migrate:export
npm run migrate:images
npm run migrate:reconcile
```

The migration captures the indexed WordPress URL inventory, rendered source snapshots, original uploads, and a side-by-side comparison with `kaj-jensen/cumbuco-net`. Generated HTML snapshots are ignored, while reproducible inventory and reconciliation reports are committed.

## Availability and enquiries

Property pages display imported availability as a fallback and request live blocked dates from the Worker API. Google Calendar remains the source of truth; its private iCal feeds are stored in the encrypted `GOOGLE_CALENDAR_FEEDS` Worker secret. See [docs/google-calendar-setup.md](docs/google-calendar-setup.md).

The enquiry flow offers two secure channels. WhatsApp creates a structured Portuguese message containing the property, dates, guest count, name, and optional requests. Email submissions are protected by Cloudflare Turnstile and sent through the Worker Email binding to Ana and Kaj.

## Privacy-friendly conversion reporting

The browser sends an allowlisted set of aggregate funnel events without form contents, travel dates, cookies, persistent identifiers, or visitor profiles. The Worker increments daily counts in the EU-jurisdiction `cumbuco-net-br-conversions` D1 database. A scheduled Worker emails a seven-day property funnel report every Monday at 11:00 UTC.

Run the same query manually for the last seven days with:

```sh
npm run report:funnel
```

Pass a different period in days after `--`, for example `npm run report:funnel -- 30`.

## SEO migration

- Existing property URLs remain unchanged, including Jardim Reale and Dunas Village Cumbuco.
- Valuable legacy pages receive a single permanent redirect to their closest replacement.
- Retired WordPress utility pages return `410 Gone` from the Worker.
- `npm run audit:seo` verifies metadata, canonicals, structured data, headings, image alternatives, and duplicate titles.

## Redirects

Production redirects are declared in `public/_redirects` and applied by Cloudflare Workers Static Assets. Keep redirect destinations relative so the same rules work on the Workers preview and the final custom domain.
