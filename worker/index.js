const json = (body, status = 200, cacheControl = "no-store") =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  });

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "connect-src 'self' https://challenges.cloudflare.com",
  "upgrade-insecure-requests",
].join("; ");

const LEGACY_QUERY_PARAMETERS = ["currency", "mode"];
const EMAIL_FORWARDING_DESTINATIONS = [
  "anaceres.teixeira@gmail.com",
  "kaj.jensen@outlook.com",
];
const ENQUIRY_FROM = { email: "enquiries@cumbuco.net.br", name: "Cumbuco Aluguéis" };
const REPORT_FROM = { email: "reports@cumbuco.net.br", name: "Cumbuco Aluguéis" };
const REDIRECT_HOSTNAMES = new Set(["cumbuco.com.br", "www.cumbuco.com.br"]);
const LEGACY_PATH_REDIRECTS = new Map([
  ["/apartamentos/", "/listings/apartment/"],
  ["/casas/", "/listings/house/"],
  ["/listings/apartamento/", "/listings/apartment/"],
  ["/listings/casa/", "/listings/house/"],
  ["/action/imovel/", "/properties/"],
  ["/area/cumbuco/", "/properties/"],
  ["/cumbuco/", "/city/cumbuco/"],
  ["/contato/", "/contact-cumbuco-rentals/"],
  ["/contact/", "/contact-cumbuco-rentals/"],
  ["/sobre-cumbuco-alugueis/", "/about-us/"],
  ["/termos-e-condicoes/", "/terms-and-conditions/"],
  ["/cumbuco-kitesurf/", "/city/cumbuco/kiteboarding/"],
  ["/cumbuco-apartamentos-dream-village/", "/properties/"],
  ["/cumbuco-alguel-por-temporada/", "/properties/"],
  ["/cumbuco-aluguel-por-temporada/", "/properties/"],
  ["/alugue-com-seguranca/", "/about-us/"],
  ["/main-homepage/", "/"],
  ["/homepage-v5-header-google-maps/", "/"],
  ["/homepage-version-2-header-image/", "/"],
  ["/homepage-version-3-theme-slider-header/", "/"],
  ["/homepage-version-4-theme-slider/", "/"],
  ["/main-homepage/", "/"],
  ["/properties-list-half-map/", "/properties/"],
  ["/properties-list-sidebar-left/", "/properties/"],
  ["/properties-list-sidebar-right/", "/properties/"],
  ["/properties-list-standard/", "/properties/"],
  ["/properties-list/", "/properties/"],
  ["/uber-uns/", "/about-us/"],
]);
const GONE_WORDPRESS_PATHS = new Set([
  "/action/shared-room/",
  "/add-new-listing/",
  "/add-new-property/",
  "/advanced-search/",
  "/advanced-search-2/",
  "/advanced-search-2-2/",
  "/all-in-one-calendar/",
  "/all-in-one-calendar-2/",
  "/blog-list/",
  "/custom-widgets/",
  "/edit-listing/",
  "/favorite-listings/",
  "/ical-feed/",
  "/ical/",
  "/inbox/",
  "/invoices/",
  "/login/",
  "/modified-vc-shortcodes/",
  "/my-bookings/",
  "/my-profile/",
  "/my-reservations/",
  "/my-subscription/",
  "/new-york-presentation/",
  "/owners-list/",
  "/owners-sidebar-left/",
  "/owners-sidebar-right/",
  "/paypal-processor/",
  "/profile/",
  "/sample-page/",
  "/shortcode-tes/",
  "/solicitacao-de-reservas/",
  "/stripe-processor/",
  "/user-dashboard/",
  "/wp-rentals-shortcodes/",
]);

function secureResponse(response, { preview = false } = {}) {
  const headers = new Headers(response.headers);
  const contentType = headers.get("content-type") || "";
  if (contentType.startsWith("font/")) headers.set("cache-control", "public, max-age=31536000, immutable");
  else if (contentType.startsWith("image/")) headers.set("cache-control", "public, max-age=86400, stale-while-revalidate=604800");
  headers.set("content-security-policy", CONTENT_SECURITY_POLICY);
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("strict-transport-security", "max-age=15552000");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("x-permitted-cross-domain-policies", "none");
  if (preview) headers.set("x-robots-tag", "noindex, nofollow");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function parseGoogleCalendarFeeds(value) {
  if (!value) return {};
  try {
    const feeds = JSON.parse(value);
    return feeds && typeof feeds === "object" && !Array.isArray(feeds) ? feeds : {};
  } catch {
    return {};
  }
}

function parseCalendarDate(line) {
  const separator = line.indexOf(":");
  if (separator < 0) return null;
  const value = line.slice(separator + 1).trim();
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function addDays(iso, days) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseReservedDates(ics) {
  const unfolded = ics.replace(/\r?\n[ \t]/g, "");
  const events = unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  const dates = new Set();

  for (const event of events) {
    const lines = event.split(/\r?\n/);
    const startLine = lines.find((line) => line.startsWith("DTSTART"));
    const endLine = lines.find((line) => line.startsWith("DTEND"));
    const start = startLine ? parseCalendarDate(startLine) : null;
    const end = endLine ? parseCalendarDate(endLine) : start ? addDays(start, 1) : null;
    if (!start || !end) continue;

    for (let date = start, guard = 0; date < end && guard < 730; date = addDays(date, 1), guard += 1) {
      dates.add(date);
    }
  }

  return [...dates].sort();
}

function currentDateInFortaleza(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function keepCurrentYearFromToday(dates, today = currentDateInFortaleza()) {
  const yearEnd = `${today.slice(0, 4)}-12-31`;
  return dates.filter((date) => date >= today && date <= yearEnd);
}

function keepBookingHorizon(dates, today = currentDateInFortaleza()) {
  const horizon = new Date(`${today}T12:00:00Z`);
  horizon.setUTCFullYear(horizon.getUTCFullYear() + 2);
  const horizonDate = horizon.toISOString().slice(0, 10);
  return dates.filter((date) => date >= today && date <= horizonDate);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CONVERSION_EVENTS = new Set([
  "page_view",
  "organic_entry",
  "property_open",
  "availability_jump",
  "availability_view",
  "calendar_expand",
  "dates_selected",
  "enquiry_start",
  "enquiry_email_sent",
  "enquiry_whatsapp_open",
  "property_whatsapp_open",
]);

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanSingleLine(value, maxLength) {
  return cleanText(value, maxLength).replace(/[\r\n\t]+/g, " ");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

async function conversionEvent(request, env, context) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 2_048) return new Response(null, { status: 413 });

  let input;
  try {
    input = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const event = cleanText(input.event, 48);
  const property = cleanText(input.property, 100);
  const source = cleanText(input.source, 80) || "unspecified";
  const page = cleanText(input.page, 180);
  if (
    !CONVERSION_EVENTS.has(event) ||
    (property && !/^[a-z0-9-]+$/.test(property)) ||
    !/^[a-z0-9_-]+$/.test(source) ||
    !page.startsWith("/")
  ) {
    return new Response(null, { status: 400 });
  }

  const point = { event, property: property || "none", source, page };
  if (env.CONVERSIONS_DB) {
    const eventDate = currentDateInFortaleza();
    context.waitUntil(
      env.CONVERSIONS_DB.prepare(
        `INSERT INTO conversion_daily (event_date, property, event, source, page, event_count)
         VALUES (?1, ?2, ?3, ?4, ?5, 1)
         ON CONFLICT(event_date, property, event, source, page)
         DO UPDATE SET event_count = event_count + 1`,
      ).bind(eventDate, point.property, point.event, point.source, point.page).run(),
    );
  }
  if (env.CONVERSION_ANALYTICS) {
    env.CONVERSION_ANALYTICS.writeDataPoint({
      blobs: [point.event, point.property, point.page, point.source],
      doubles: [1],
      indexes: [point.event],
    });
  } else {
    console.log(JSON.stringify({ type: "conversion", ...point }));
  }
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

function validStayDates(arrival, departure, today = currentDateInFortaleza()) {
  if (!DATE_PATTERN.test(arrival) || !DATE_PATTERN.test(departure)) return false;
  const isRealDate = (value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!isRealDate(arrival) || !isRealDate(departure)) return false;
  const horizon = new Date(`${today}T12:00:00Z`);
  horizon.setUTCFullYear(horizon.getUTCFullYear() + 2);
  const horizonDate = horizon.toISOString().slice(0, 10);
  return arrival >= today && departure > arrival && departure <= horizonDate;
}

async function verifyTurnstile(token, request, secret) {
  if (!secret || !token) return false;
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP");
  if (remoteIp) body.append("remoteip", remoteIp);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true && (!result.hostname || result.hostname === "www.cumbuco.net.br" || result.hostname.endsWith(".workers.dev"));
  } catch {
    return false;
  }
}

async function enquiry(request, env) {
  if (!env.EMAIL || !env.TURNSTILE_SECRET_KEY) {
    return json({ error: "Email enquiries are temporarily unavailable. Please use WhatsApp." }, 503);
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16_384) return json({ error: "Enquiry is too large." }, 413);

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid enquiry." }, 400);
  }

  if (cleanText(input.website, 200)) return json({ ok: true }, 200);

  const name = cleanSingleLine(input.name, 100);
  const email = cleanText(input.email, 254).toLowerCase();
  const property = cleanSingleLine(input.property, 120);
  const propertySlug = cleanText(input.propertySlug, 100);
  const arrival = cleanText(input.arrival, 10);
  const departure = cleanText(input.departure, 10);
  const message = cleanText(input.message, 2_000);
  const guests = Number(input.guests);

  if (
    name.length < 2 ||
    !EMAIL_PATTERN.test(email) ||
    !property ||
    !/^[a-z0-9-]+$/.test(propertySlug) ||
    !Number.isInteger(guests) ||
    guests < 1 ||
    guests > 30 ||
    !validStayDates(arrival, departure) ||
    input.consent !== true
  ) {
    return json({ error: "Please check the enquiry details and try again." }, 400);
  }

  const turnstileValid = await verifyTurnstile(cleanText(input.turnstileToken, 2_048), request, env.TURNSTILE_SECRET_KEY);
  if (!turnstileValid) return json({ error: "Security verification failed. Please try again." }, 400);

  const reference = crypto.randomUUID().slice(0, 8).toUpperCase();
  const lines = [
    `Nova consulta pelo site — Cumbuco Aluguéis (${reference})`,
    "",
    `Property: ${property}`,
    `Arrival: ${arrival}`,
    `Departure: ${departure}`,
    `Guests: ${guests}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Message: ${message || "—"}`,
  ];
  const htmlRows = [
    ["Reference", reference],
    ["Property", property],
    ["Arrival", arrival],
    ["Departure", departure],
    ["Guests", String(guests)],
    ["Name", name],
    ["Email", email],
    ["Message", message || "—"],
  ].map(([label, value]) => `<tr><th align="left" style="padding:6px 12px 6px 0">${label}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`).join("");

  try {
    await Promise.all(EMAIL_FORWARDING_DESTINATIONS.map((destination) => env.EMAIL.send({
      to: destination,
      from: ENQUIRY_FROM,
      replyTo: { email, name },
      subject: `Nova consulta pelo site — ${property} · ${arrival} · ${reference}`,
      text: lines.join("\n"),
      html: `<h1>Nova consulta pelo site</h1><table>${htmlRows}</table><p>Responda diretamente a este e-mail para falar com ${escapeHtml(name)}.</p>`,
    })));
    return json({ ok: true, reference }, 200);
  } catch (error) {
    console.error("Enquiry email failed", error?.code || "unknown");
    const rateLimited = error?.code === "E_RATE_LIMIT_EXCEEDED" || error?.code === "E_DAILY_LIMIT_EXCEEDED";
    return json(
      { error: rateLimited ? "Email service is busy. Please try again shortly or use WhatsApp." : "Email could not be sent. Please use WhatsApp or try again." },
      rateLimited ? 429 : 502,
    );
  }
}

function funnelReportContent(rows, days = 7) {
  const columns = [
    ["views", "Visualizações"],
    ["property_opens", "Aberturas"],
    ["dates_viewed", "Datas vistas"],
    ["dates_selected", "Datas escolhidas"],
    ["enquiries_started", "Consultas iniciadas"],
    ["whatsapp_enquiries", "WhatsApp"],
    ["email_enquiries", "E-mail"],
  ];
  const normalized = rows.map((row) => Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, key === "property" ? value : Number(value || 0)]),
  ));
  const textRows = normalized.length
    ? normalized.map((row) => `${row.property}: ${columns.map(([key, label]) => `${label} ${row[key]}`).join(" · ")}`).join("\n")
    : "Nenhuma interação de imóvel registrada no período.";
  const htmlRows = normalized.length
    ? normalized.map((row) => `<tr><th align="left">${escapeHtml(String(row.property))}</th>${columns.map(([key]) => `<td align="right">${row[key]}</td>`).join("")}</tr>`).join("")
    : `<tr><td colspan="8">Nenhuma interação de imóvel registrada no período.</td></tr>`;
  return {
    text: `Funil de conversão por imóvel — últimos ${days} dias\n\n${textRows}\n\nOs números são contagens agregadas e não identificam visitantes.`,
    html: `<h1>Funil de conversão por imóvel</h1><p>Últimos ${days} dias. Contagens agregadas, sem identificação de visitantes.</p><table cellpadding="6" cellspacing="0" border="1"><thead><tr><th>Imóvel</th>${columns.map(([, label]) => `<th>${label}</th>`).join("")}</tr></thead><tbody>${htmlRows}</tbody></table>`,
  };
}

function seoReportContent({ rows, audit, days = 30 }) {
  const organicRows = rows.length
    ? rows.map((row) => `${row.page}: ${row.search_engine} ${Number(row.entries || 0)}`).join("\n")
    : "Nenhuma entrada orgânica registrada no período.";
  const organicHtml = rows.length
    ? rows.map((row) => `<tr><td>${escapeHtml(String(row.page))}</td><td>${escapeHtml(String(row.search_engine))}</td><td align="right">${Number(row.entries || 0)}</td></tr>`).join("")
    : '<tr><td colspan="3">Nenhuma entrada orgânica registrada no período.</td></tr>';
  const issueText = audit.issues.length ? audit.issues.join("\n") : "Nenhum problema técnico encontrado.";
  const issueHtml = audit.issues.length
    ? `<ul>${audit.issues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join("")}</ul>`
    : "<p>Nenhum problema técnico encontrado.</p>";
  return {
    text: `Relatório mensal de SEO — últimos ${days} dias\n\nSaúde técnica: ${audit.okPages}/${audit.totalPages} páginas aprovadas\nSitemap: ${audit.sitemapOk ? "OK" : "ERRO"}\nRobots.txt: ${audit.robotsOk ? "OK" : "ERRO"}\n\nProblemas\n${issueText}\n\nEntradas orgânicas por página e buscador\n${organicRows}\n\nMedição agregada e sem identificação de visitantes. Consultas, impressões, posições e cliques do Google exigem uma integração autorizada com o Search Console.`,
    html: `<h1>Relatório mensal de SEO</h1><p>Últimos ${days} dias.</p><h2>Saúde técnica</h2><p><strong>${audit.okPages}/${audit.totalPages}</strong> páginas aprovadas · Sitemap: <strong>${audit.sitemapOk ? "OK" : "ERRO"}</strong> · Robots.txt: <strong>${audit.robotsOk ? "OK" : "ERRO"}</strong></p>${issueHtml}<h2>Entradas orgânicas</h2><table cellpadding="6" cellspacing="0" border="1"><thead><tr><th>Página</th><th>Buscador</th><th>Entradas</th></tr></thead><tbody>${organicHtml}</tbody></table><p>Medição agregada, sem cookies nem identificação de visitantes.</p><p><small>Consultas, impressões, posições e cliques do Google exigem uma integração autorizada com o Search Console.</small></p>`,
  };
}

async function productionSeoAudit(origin = "https://www.cumbuco.net.br") {
  const issues = [];
  let sitemapOk = false;
  let robotsOk = false;
  let urls = [];
  try {
    const sitemapResponse = await fetch(`${origin}/sitemap.xml`, { headers: { accept: "application/xml" } });
    const sitemap = await sitemapResponse.text();
    sitemapOk = sitemapResponse.ok && sitemap.includes("<urlset");
    urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    if (!sitemapOk) issues.push(`Sitemap indisponível (${sitemapResponse.status}).`);
  } catch {
    issues.push("Sitemap indisponível.");
  }
  try {
    const robotsResponse = await fetch(`${origin}/robots.txt`);
    const robots = await robotsResponse.text();
    robotsOk = robotsResponse.ok && robots.includes(`${origin}/sitemap.xml`);
    if (!robotsOk) issues.push(`robots.txt inválido (${robotsResponse.status}).`);
  } catch {
    issues.push("robots.txt indisponível.");
  }
  let okPages = 0;
  await Promise.all(urls.map(async (url) => {
    try {
      const response = await fetch(url, { headers: { accept: "text/html" } });
      const html = await response.text();
      const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || "";
      const valid = response.ok && canonical === url && /<title>[^<]+<\/title>/i.test(html) && /<meta name="description" content="[^"]+"/i.test(html) && !/noindex/i.test(html);
      if (valid) okPages += 1;
      else issues.push(`${new URL(url).pathname}: status, canonical ou metadados inválidos.`);
    } catch {
      issues.push(`${new URL(url).pathname}: página indisponível.`);
    }
  }));
  return { sitemapOk, robotsOk, totalPages: urls.length, okPages, issues };
}

async function weeklyFunnelReport(env) {
  if (!env.CONVERSIONS_DB || !env.EMAIL) return;
  const result = await env.CONVERSIONS_DB.prepare(
    `SELECT property,
      SUM(CASE WHEN event = 'page_view' THEN event_count ELSE 0 END) AS views,
      SUM(CASE WHEN event = 'property_open' THEN event_count ELSE 0 END) AS property_opens,
      SUM(CASE WHEN event = 'availability_view' THEN event_count ELSE 0 END) AS dates_viewed,
      SUM(CASE WHEN event = 'dates_selected' THEN event_count ELSE 0 END) AS dates_selected,
      SUM(CASE WHEN event = 'enquiry_start' THEN event_count ELSE 0 END) AS enquiries_started,
      SUM(CASE WHEN event = 'enquiry_whatsapp_open' THEN event_count ELSE 0 END) AS whatsapp_enquiries,
      SUM(CASE WHEN event = 'enquiry_email_sent' THEN event_count ELSE 0 END) AS email_enquiries
     FROM conversion_daily
     WHERE event_date >= date('now', '-6 days') AND property <> 'none'
     GROUP BY property ORDER BY views DESC, property ASC`,
  ).all();
  const report = funnelReportContent(result.results || []);
  await Promise.all(EMAIL_FORWARDING_DESTINATIONS.map((destination) => env.EMAIL.send({
    to: destination,
    from: REPORT_FROM,
    subject: "Relatório semanal do site — Cumbuco Aluguéis",
    text: report.text,
    html: report.html,
  })));
}

async function monthlySeoReport(env) {
  if (!env.CONVERSIONS_DB || !env.EMAIL) return;
  const [result, audit] = await Promise.all([
    env.CONVERSIONS_DB.prepare(
      `SELECT page, source AS search_engine, SUM(event_count) AS entries
       FROM conversion_daily
       WHERE event = 'organic_entry' AND event_date >= date('now', '-29 days')
       GROUP BY page, source ORDER BY entries DESC, page ASC`,
    ).all(),
    productionSeoAudit(),
  ]);
  const report = seoReportContent({ rows: result.results || [], audit });
  await Promise.all(EMAIL_FORWARDING_DESTINATIONS.map((destination) => env.EMAIL.send({
    to: destination,
    from: REPORT_FROM,
    subject: "Relatório mensal de SEO — Cumbuco Aluguéis",
    text: report.text,
    html: report.html,
  })));
}

export { currentDateInFortaleza, funnelReportContent, keepBookingHorizon, keepCurrentYearFromToday, parseReservedDates, productionSeoAudit, seoReportContent };

async function availability(request, env, context) {
  const property = new URL(request.url).searchParams.get("property") || "";
  if (!/^[a-z0-9-]+$/.test(property)) return json({ error: "Invalid property." }, 400);

  const feeds = parseGoogleCalendarFeeds(env.GOOGLE_CALENDAR_FEEDS);
  const feedUrl = feeds[property];
  if (typeof feedUrl !== "string" || !feedUrl.startsWith("https://calendar.google.com/")) {
    return json({ property, live: false }, 200, "public, max-age=300, s-maxage=900");
  }

  const cache = caches.default;
  const cacheKey = new Request(request.url, { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const response = await fetch(feedUrl, { headers: { accept: "text/calendar" } });
  if (!response.ok) return json({ error: "The calendar feed could not be loaded." }, 502);

  const result = json(
    { property, live: true, reservedDates: keepBookingHorizon(parseReservedDates(await response.text())) },
    200,
    "public, max-age=300, s-maxage=900",
  );
  context.waitUntil(cache.put(cacheKey, result.clone()));
  return result;
}

export default {
  async email(message) {
    const results = await Promise.allSettled(
      EMAIL_FORWARDING_DESTINATIONS.map((destination) => message.forward(destination)),
    );
    const failures = results.filter((result) => result.status === "rejected");
    if (failures.length > 0) {
      throw new AggregateError(
        failures.map((failure) => failure.reason),
        "One or more email forwarding destinations failed.",
      );
    }
  },

  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (REDIRECT_HOSTNAMES.has(url.hostname)) {
      url.protocol = "https:";
      url.hostname = "www.cumbuco.net.br";
      return secureResponse(Response.redirect(url.toString(), 301));
    }
    const productionHostname = url.hostname === "cumbuco.net.br" || url.hostname === "www.cumbuco.net.br";
    let redirect = false;

    if (productionHostname) {
      try {
        const visitor = JSON.parse(request.headers.get("CF-Visitor") || "{}");
        if (visitor.scheme === "http") {
          url.protocol = "https:";
          redirect = true;
        }
      } catch {
        // Ignore malformed infrastructure metadata and continue normally.
      }
    }

    if (url.hostname === "cumbuco.net.br") {
      url.hostname = "www.cumbuco.net.br";
      redirect = true;
    }
    if (productionHostname) {
      for (const parameter of LEGACY_QUERY_PARAMETERS) {
        if (url.searchParams.has(parameter)) {
          url.searchParams.delete(parameter);
          redirect = true;
        }
      }
    }
    const normalizedPath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    const legacyReplacement = productionHostname ? LEGACY_PATH_REDIRECTS.get(normalizedPath) : undefined;
    if (legacyReplacement) {
      url.pathname = legacyReplacement;
      url.search = "";
      redirect = true;
    }
    if (redirect) {
      return secureResponse(Response.redirect(url.toString(), 301));
    }
    if (productionHostname && GONE_WORDPRESS_PATHS.has(normalizedPath)) {
      return secureResponse(new Response("Esta página antiga do WordPress não está mais disponível.", {
        status: 410,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=86400",
        },
      }));
    }
    if (request.method === "GET" && url.pathname === "/api/availability") {
      return secureResponse(await availability(request, env, context));
    }
    if (request.method === "POST" && url.pathname === "/api/enquiry") {
      return secureResponse(await enquiry(request, env));
    }
    if (request.method === "POST" && url.pathname === "/api/events") {
      return secureResponse(await conversionEvent(request, env, context));
    }
    if (url.pathname.startsWith("/api/")) {
      return secureResponse(json({ error: "Not found." }, 404));
    }
    const response = await env.ASSETS.fetch(request);
    return secureResponse(response, { preview: url.hostname.endsWith(".workers.dev") });
  },

  async scheduled(controller, env, context) {
    context.waitUntil(controller.cron === "30 11 1 * *" ? monthlySeoReport(env) : weeklyFunnelReport(env));
  },
};
