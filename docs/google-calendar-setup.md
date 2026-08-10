# Google Calendar availability setup

The website keeps Google Calendar as the source of truth for blocked dates. A Cloudflare Worker reads each calendar's private iCal feed and returns only the blocked dates to the public website. The private feed addresses are never exposed in the page or committed to GitHub.

## 1. Collect each calendar feed

On a computer, open Google Calendar and repeat these steps for every active rental:

1. Open **Settings**.
2. Under **Settings for my calendars**, select the property calendar.
3. Open **Integrate calendar**.
4. Copy the **Secret address in iCal format**.

Treat these addresses like passwords. Do not paste them into GitHub, source files, screenshots, or public messages.

## 2. Build the feed map

Create one JSON object using the exact property slugs below:

```json
{
  "beach-sun-cumbuco": "GOOGLE_ICAL_URL",
  "breezes-cumbuco": "GOOGLE_ICAL_URL",
  "casa-chick": "GOOGLE_ICAL_URL",
  "casa-maria-flor-cumbuco": "GOOGLE_ICAL_URL",
  "casa-vermelha": "GOOGLE_ICAL_URL",
  "dream-village-301-h": "GOOGLE_ICAL_URL",
  "dream-village-301-v": "GOOGLE_ICAL_URL",
  "dream-village-302-v": "GOOGLE_ICAL_URL",
  "dream-village-401-h": "GOOGLE_ICAL_URL",
  "dunas-village": "GOOGLE_ICAL_URL",
  "villa-branca": "GOOGLE_ICAL_URL"
}
```

If several properties intentionally use the same calendar, use the same feed URL for each relevant slug.

## 3. Store the map securely in Cloudflare

After the Worker version containing the availability endpoint has deployed:

1. Open **Workers & Pages** in Cloudflare.
2. Select the `cumbuco-net` Worker.
3. Open **Settings** and then **Variables and Secrets**.
4. Add an encrypted secret named `GOOGLE_CALENDAR_FEEDS`.
5. Paste the complete one-line JSON object as its value and deploy the change.

Alternatively, from this repository run `npx wrangler secret put GOOGLE_CALENDAR_FEEDS` and paste the JSON when Wrangler prompts for the secret value.

## Behaviour

- Every Google Calendar event is treated as an unavailable stay.
- For all-day events, the Google Calendar end date is treated as the checkout date and remains available.
- The Worker refreshes the Google feeds at least every 15 minutes.
- Imported WordPress dates remain as a fallback until the live feed is configured.
- Availability is indicative; every enquiry still requires personal confirmation.
