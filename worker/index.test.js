import assert from "node:assert/strict";
import test from "node:test";

import worker, { currentDateInFortaleza, funnelReportContent, keepBookingHorizon, seoReportContent } from "./index.js";

const env = {
  ASSETS: {
    fetch: async () => new Response("<!doctype html><title>Test</title>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  },
};

const context = { waitUntil() {} };

test("forwards incoming email to both verified contact addresses", async () => {
  const destinations = [];
  await worker.email({
    async forward(destination) {
      destinations.push(destination);
    },
  });

  assert.deepEqual(destinations.sort(), [
    "anaceres.teixeira@gmail.com",
    "kaj.jensen@outlook.com",
  ]);
});

test("keeps reserved dates throughout the two-year booking horizon", () => {
  assert.deepEqual(
    keepBookingHorizon(
      ["2026-08-10", "2026-12-31", "2027-06-15", "2028-08-11", "2028-08-12"],
      "2026-08-11",
    ),
    ["2026-12-31", "2027-06-15", "2028-08-11"],
  );
});

test("redirects the apex domain to www and preserves the path", async () => {
  const response = await worker.fetch(
    new Request("https://cumbuco.net.br/properties/villa-branca/?from=test"),
    env,
    context,
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://www.cumbuco.net.br/properties/villa-branca/?from=test",
  );
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
});

test("redirects both cumbuco.com.br hostnames to the canonical site in one hop", async () => {
  for (const hostname of ["cumbuco.com.br", "www.cumbuco.com.br"]) {
    const response = await worker.fetch(
      new Request(`https://${hostname}/casas-de-praia-cumbuco/?utm_source=old-domain`),
      env,
      context,
    );
    assert.equal(response.status, 301);
    assert.equal(response.headers.get("location"), "https://www.cumbuco.net.br/casas-de-praia-cumbuco/?utm_source=old-domain");
    assert.equal(response.headers.get("strict-transport-security"), "max-age=15552000");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
  }
});

test("upgrades HTTP visitors to the canonical HTTPS URL", async () => {
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/properties/villa-branca/", {
      headers: { "CF-Visitor": JSON.stringify({ scheme: "http" }) },
    }),
    env,
    context,
  );

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.cumbuco.net.br/properties/villa-branca/");
});

test("removes obsolete WordPress display parameters in one permanent redirect", async () => {
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/properties/beach-sun-cumbuco/?currency=EUR&mode=list&utm_source=test"),
    env,
    context,
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get("location"),
    "https://www.cumbuco.net.br/properties/beach-sun-cumbuco/?utm_source=test",
  );
});

test("returns gone for confirmed obsolete WordPress utility pages", async () => {
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/advanced-search/"),
    env,
    context,
  );

  assert.equal(response.status, 410);
  assert.equal(response.headers.get("cache-control"), "public, max-age=86400");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("redirects legacy WordPress layouts to their closest canonical page", async () => {
  const response = await worker.fetch(
    new Request("https://cumbuco.net.br/properties-list-half-map/?currency=EUR"),
    env,
    context,
  );

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://www.cumbuco.net.br/properties/");
});

test("adds security headers to production asset responses", async () => {
  const response = await worker.fetch(new Request("https://www.cumbuco.net.br/"), env, context);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("strict-transport-security"), "max-age=15552000");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-robots-tag"), null);
});

test("gives media effective browser caching without hiding future image updates", async () => {
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/images/content/cumbuco/sunny-kitesurfing-720.avif"),
    { ...env, ASSETS: { fetch: async () => new Response("image", { headers: { "content-type": "image/avif" } }) } },
    context,
  );
  assert.equal(response.headers.get("cache-control"), "public, max-age=86400, stale-while-revalidate=604800");
});

test("prevents indexing of the workers.dev preview", async () => {
  const response = await worker.fetch(
    new Request("https://cumbuco-net.example.workers.dev/"),
    env,
    context,
  );

  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
});

test("returns a quiet imported-calendar fallback with security headers", async () => {
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/api/availability?property=villa-branca"),
    env,
    context,
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), "public, max-age=300, s-maxage=900");
  assert.deepEqual(await response.json(), { property: "villa-branca", live: false });
});

test("keeps email enquiries unavailable until secure bindings are configured", async () => {
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/api/enquiry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }),
    env,
    context,
  );

  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /temporarily unavailable/i);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("records only allowlisted, anonymous conversion events", async () => {
  const points = [];
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "dates_selected", property: "villa-branca", page: "/properties/villa-branca/" }),
    }),
    { ...env, CONVERSION_ANALYTICS: { writeDataPoint: (point) => points.push(point) } },
    context,
  );

  assert.equal(response.status, 204);
  assert.deepEqual(points[0].blobs, ["dates_selected", "villa-branca", "/properties/villa-branca/", "unspecified"]);
  assert.equal(points[0].doubles[0], 1);
});

test("rejects unknown conversion events", async () => {
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "form_contents", property: "villa-branca", page: "/" }),
    }),
    env,
    context,
  );
  assert.equal(response.status, 400);
});

test("falls back to structured observability when Analytics Engine is unavailable", async () => {
  const messages = [];
  const originalLog = console.log;
  console.log = (message) => messages.push(message);
  try {
    const response = await worker.fetch(
      new Request("https://www.cumbuco.net.br/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "calendar_expand", property: "villa-branca", page: "/properties/villa-branca/" }),
      }),
      env,
      context,
    );
    assert.equal(response.status, 204);
    assert.deepEqual(JSON.parse(messages[0]), {
      type: "conversion",
      event: "calendar_expand",
      property: "villa-branca",
      source: "unspecified",
      page: "/properties/villa-branca/",
    });
  } finally {
    console.log = originalLog;
  }
});

test("validates Turnstile and sends a structured rental enquiry", async () => {
  const sent = [];
  const configuredEnv = {
    ...env,
    TURNSTILE_SECRET_KEY: "test-secret",
    EMAIL: { send: async (message) => { sent.push(message); return { messageId: "test-id" }; } },
  };
  const today = currentDateInFortaleza();
  const departureDate = new Date(`${today}T12:00:00Z`);
  departureDate.setUTCDate(departureDate.getUTCDate() + 1);
  const departure = departureDate.toISOString().slice(0, 10);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    return Response.json({ success: true, hostname: "www.cumbuco.net.br" });
  };

  try {
    const response = await worker.fetch(
      new Request("https://www.cumbuco.net.br/api/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          property: "Villa Branca",
          propertySlug: "villa-branca",
          arrival: today,
          departure,
          guests: 4,
          name: "Test Guest",
          email: "guest@example.com",
          message: "Airport transfer, please.",
          consent: true,
          turnstileToken: "valid-token",
        }),
      }),
      configuredEnv,
      context,
    );

    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    assert.equal(sent.length, 2);
    assert.deepEqual(sent.map((message) => message.to).sort(), [
      "anaceres.teixeira@gmail.com",
      "kaj.jensen@outlook.com",
    ]);
    assert.equal(sent[0].from.email, "enquiries@cumbuco.net.br");
    assert.equal(sent[0].replyTo.email, "guest@example.com");
    assert.match(sent[0].subject, /^Nova consulta pelo site/);
    assert.match(sent[0].subject, /Villa Branca/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects invalid enquiry fields before sending email", async () => {
  let sent = false;
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/api/enquiry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "x", email: "not-an-email", consent: true }),
    }),
    {
      ...env,
      TURNSTILE_SECRET_KEY: "test-secret",
      EMAIL: { send: async () => { sent = true; } },
    },
    context,
  );

  assert.equal(response.status, 400);
  assert.equal(sent, false);
});

test("stores only daily aggregate conversion counts in D1", async () => {
  const writes = [];
  const pending = [];
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "page_view", property: "villa-branca", source: "page_load", page: "/properties/villa-branca/" }),
    }),
    {
      ...env,
      CONVERSIONS_DB: {
        prepare(sql) {
          return { bind(...values) { return { async run() { writes.push({ sql, values }); } }; } };
        },
      },
    },
    { waitUntil(promise) { pending.push(promise); } },
  );

  await Promise.all(pending);
  assert.equal(response.status, 204);
  assert.equal(writes.length, 1);
  assert.match(writes[0].sql, /ON CONFLICT/);
  assert.deepEqual(writes[0].values.slice(1), ["villa-branca", "page_view", "page_load", "/properties/villa-branca/"]);
});

test("builds a readable weekly funnel report", () => {
  const report = funnelReportContent([{
    property: "villa-branca",
    views: 120,
    property_opens: 42,
    dates_viewed: 30,
    dates_selected: 12,
    enquiries_started: 8,
    whatsapp_enquiries: 5,
    email_enquiries: 2,
  }]);
  assert.match(report.text, /villa-branca/);
  assert.match(report.text, /Visualizações 120/);
  assert.match(report.html, /<table/);
  assert.match(report.html, /WhatsApp/);
});

test("builds a readable monthly SEO report", () => {
  const report = seoReportContent({
    rows: [{ page: "/casas-de-praia-cumbuco/", search_engine: "google", entries: 34 }],
    audit: { sitemapOk: true, robotsOk: true, totalPages: 31, okPages: 31, issues: [] },
  });
  assert.match(report.text, /31\/31 páginas aprovadas/);
  assert.match(report.text, /google 34/);
  assert.match(report.html, /Entradas orgânicas/);
});

test("accepts aggregate organic entry events", async () => {
  const points = [];
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "organic_entry", property: "", source: "google", page: "/casas-de-praia-cumbuco/" }),
    }),
    { ...env, CONVERSION_ANALYTICS: { writeDataPoint: (point) => points.push(point) } },
    context,
  );
  assert.equal(response.status, 204);
  assert.deepEqual(points[0].blobs, ["organic_entry", "none", "/casas-de-praia-cumbuco/", "google"]);
});
