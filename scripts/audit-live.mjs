const origin = (process.argv[2] || "https://www.cumbuco.net").replace(/\/$/, "");

async function get(url, options = {}) {
  const response = await fetch(url, { redirect: "manual", ...options });
  const contentType = response.headers.get("content-type") || "";
  const text = /(?:text|xml|json)/.test(contentType) ? await response.text() : "";
  return { response, text };
}

const sitemapUrl = `${origin}/sitemap.xml`;
const sitemap = await get(sitemapUrl);
const pages = [...sitemap.text.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const internalUrls = new Set(pages);
const images = new Set();
const issues = [];
const pageSummaries = [];

if (sitemap.response.status !== 200) issues.push(`Sitemap ${sitemap.response.status}: ${sitemapUrl}`);

for (const url of pages) {
  const { response, text } = await get(url);
  if (response.status !== 200) issues.push(`${response.status} ${url}`);

  const title = text.match(/<title>(.*?)<\/title>/i)?.[1];
  const description = text.match(/<meta name="description" content="([^"]*)"/i)?.[1];
  const canonical = text.match(/<link rel="canonical" href="([^"]*)"/i)?.[1];
  const ogImage = text.match(/<meta property="og:image" content="([^"]*)"/i)?.[1];
  const h1Count = (text.match(/<h1(?:\s|>)/gi) || []).length;
  const missingAlt = (text.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) || []).length;
  const unsafeBlankLinks = [...text.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)]
    .filter(([tag]) => !/rel="[^"]*noopener/i.test(tag)).length;
  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(text);

  if (!title) issues.push(`Missing title: ${url}`);
  if (!description) issues.push(`Missing description: ${url}`);
  if (canonical !== url) issues.push(`Canonical mismatch: ${url} -> ${canonical || "missing"}`);
  if (!ogImage) issues.push(`Missing Open Graph image: ${url}`);
  if (h1Count !== 1) issues.push(`Expected one H1, found ${h1Count}: ${url}`);
  if (missingAlt) issues.push(`${missingAlt} image(s) missing alt: ${url}`);
  if (unsafeBlankLinks) issues.push(`${unsafeBlankLinks} unsafe target-blank link(s): ${url}`);
  if (!text.includes('class="skip-link"') || !text.includes('id="main-content"')) issues.push(`Missing skip navigation: ${url}`);
  if (noindex) issues.push(`Unexpected noindex: ${url}`);

  for (const script of text.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gis)) {
    try { JSON.parse(script[1]); } catch (error) { issues.push(`Invalid JSON-LD: ${url} (${error.message})`); }
  }

  pageSummaries.push({
    url,
    status: response.status,
    title,
    canonical,
    descriptionLength: description?.length || 0,
    h1Count,
    missingAlt,
    unsafeBlankLinks,
    noindex,
    bytes: Buffer.byteLength(text),
  });

  for (const match of text.matchAll(/(href|src)="([^"]+)"/g)) {
    const absolute = new URL(match[2], url);
    if (absolute.origin !== origin || absolute.protocol !== "https:") continue;
    absolute.hash = "";
    if (match[1] === "src") images.add(absolute.href);
    else internalUrls.add(absolute.href);
  }
}

for (const url of internalUrls) {
  const response = await fetch(url, { method: "HEAD", redirect: "manual" });
  if (![200, 301, 302, 308].includes(response.status)) issues.push(`Internal link ${response.status}: ${url}`);
}

for (const url of images) {
  const response = await fetch(url, { method: "HEAD", redirect: "manual" });
  if (response.status !== 200) issues.push(`Image ${response.status}: ${url}`);
}

const robots = await get(`${origin}/robots.txt`);
if (robots.response.status !== 200) issues.push(`Robots ${robots.response.status}: ${origin}/robots.txt`);
if (!robots.text.includes(sitemapUrl)) issues.push(`robots.txt does not declare ${sitemapUrl}`);

const llms = await get(`${origin}/llms.txt`);
if (llms.response.status !== 200) issues.push(`llms.txt ${llms.response.status}: ${origin}/llms.txt`);
if (!/^#\s+\S+/m.test(llms.text)) issues.push("llms.txt is missing an H1 heading");
if (!llms.text.includes(`${origin}/city/cumbuco/`)) issues.push("llms.txt is missing the destination guide");

const homepage = await fetch(`${origin}/`, { redirect: "manual" });
const requiredSecurityHeaders = [
  "strict-transport-security",
  "content-security-policy",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
];
const securityHeaders = Object.fromEntries(requiredSecurityHeaders.map((name) => [name, homepage.headers.get(name)]));
for (const [name, value] of Object.entries(securityHeaders)) if (!value) issues.push(`Missing security header: ${name}`);

const redirectChecks = [];
for (const [url, expected] of [
  ["http://cumbuco.net/", "https://cumbuco.net/"],
  ["https://cumbuco.net/", `${origin}/`],
  ["http://www.cumbuco.net/", `${origin}/`],
  [`${origin}/properties/beach-sun-cumbuco-2/`, "/properties/beach-sun-cumbuco/"],
  [`${origin}/properties/villa-priscila/`, "/properties/"],
]) {
  const response = await fetch(url, { redirect: "manual" });
  const location = response.headers.get("location");
  redirectChecks.push({ url, status: response.status, location, expected });
  if (![301, 308].includes(response.status) || location !== expected) {
    issues.push(`Redirect mismatch: ${url} -> ${response.status} ${location || "missing"}; expected ${expected}`);
  }
}

const result = {
  pages: pages.length,
  internalUrls: internalUrls.size,
  images: images.size,
  robotsStatus: robots.response.status,
  llmsStatus: llms.response.status,
  securityHeaders,
  redirectChecks,
  pageSummaries,
  issues,
};

console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
