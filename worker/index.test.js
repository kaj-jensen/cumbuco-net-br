import assert from "node:assert/strict";
import test from "node:test";

import worker, { currentDateInFortaleza } from "./index.js";

const env = {
  ASSETS: {
    fetch: async () => new Response("<!doctype html><title>Test</title>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  },
};

const context = { waitUntil() {} };

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

test("prevents indexing of the workers.dev preview", async () => {
  const response = await worker.fetch(
    new Request("https://cumbuco-net.example.workers.dev/"),
    env,
    context,
  );

  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
});

test("adds security headers to API errors", async () => {
  const response = await worker.fetch(
    new Request("https://www.cumbuco.net.br/api/availability?property=villa-branca"),
    env,
    context,
  );

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("cache-control"), "no-store");
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

test("validates Turnstile and sends a structured rental enquiry", async () => {
  const sent = [];
  const configuredEnv = {
    ...env,
    ENQUIRY_TO: "cumbucorentals@outlook.com",
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
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, configuredEnv.ENQUIRY_TO);
    assert.equal(sent[0].from.email, "enquiries@cumbuco.net.br");
    assert.equal(sent[0].replyTo.email, "guest@example.com");
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
      ENQUIRY_TO: "cumbucorentals@outlook.com",
      TURNSTILE_SECRET_KEY: "test-secret",
      EMAIL: { send: async () => { sent = true; } },
    },
    context,
  );

  assert.equal(response.status, 400);
  assert.equal(sent, false);
});
