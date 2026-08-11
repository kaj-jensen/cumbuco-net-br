const targetOrigin = (process.argv[2] || "https://www.cumbuco.net.br").replace(/\/$/, "");
const canonicalOrigin = (process.argv[3] || targetOrigin).replace(/\/$/, "");
const isPreview = targetOrigin !== canonicalOrigin;

function targetUrl(url) {
  const parsed = new URL(url, canonicalOrigin);
  return `${targetOrigin}${parsed.pathname}${parsed.search}`;
}

async function get(url, options = {}) {
  const response = await fetch(url, { redirect: "manual", ...options });
  const contentType = response.headers.get("content-type") || "";
  const text = /(?:text|xml|json)/.test(contentType) ? await response.text() : "";
  return { response, text };
}

const sitemapUrl = `${targetOrigin}/sitemap.xml`;
const canonicalSitemapUrl = `${canonicalOrigin}/sitemap.xml`;
const sitemap = await get(sitemapUrl);
const pages = [...sitemap.text.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const internalUrls = new Set(pages);
const images = new Set();
const issues = [];
const pageSummaries = [];

if (sitemap.response.status !== 200) issues.push(`Sitemap ${sitemap.response.status}: ${sitemapUrl}`);

for (const url of pages) {
  const fetchedUrl = targetUrl(url);
  const { response, text } = await get(fetchedUrl);
  if (response.status !== 200) issues.push(`${response.status} ${fetchedUrl}`);

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
    if (absolute.origin !== canonicalOrigin || absolute.protocol !== "https:") continue;
    absolute.hash = "";
    if (match[1] === "src") images.add(absolute.href);
    else internalUrls.add(absolute.href);
  }
}

for (const url of internalUrls) {
  const response = await fetch(targetUrl(url), { method: "HEAD", redirect: "manual" });
  if (![200, 301, 302, 308].includes(response.status)) issues.push(`Internal link ${response.status}: ${url}`);
}

for (const url of images) {
  const response = await fetch(targetUrl(url), { method: "HEAD", redirect: "manual" });
  if (response.status !== 200) issues.push(`Image ${response.status}: ${url}`);
}

const robots = await get(`${targetOrigin}/robots.txt`);
if (robots.response.status !== 200) issues.push(`Robots ${robots.response.status}: ${targetOrigin}/robots.txt`);
if (!robots.text.includes(canonicalSitemapUrl)) issues.push(`robots.txt does not declare ${canonicalSitemapUrl}`);

const llms = await get(`${targetOrigin}/llms.txt`);
if (llms.response.status !== 200) issues.push(`llms.txt ${llms.response.status}: ${targetOrigin}/llms.txt`);
if (!/^#\s+\S+/m.test(llms.text)) issues.push("llms.txt is missing an H1 heading");
if (!llms.text.includes(`${canonicalOrigin}/city/cumbuco/`)) issues.push("llms.txt is missing the destination guide");

const homepage = await fetch(`${targetOrigin}/`, { redirect: "manual" });
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
const previewRobotsHeader = homepage.headers.get("x-robots-tag");
if (isPreview && previewRobotsHeader !== "noindex, nofollow") issues.push(`Preview indexing protection missing: ${previewRobotsHeader || "missing"}`);
if (!isPreview && previewRobotsHeader) issues.push(`Unexpected production X-Robots-Tag: ${previewRobotsHeader}`);

const redirectChecks = [];
if (!isPreview) {
  for (const [url, expected] of [
    [`http://cumbuco.net.br/`, `${canonicalOrigin}/`],
    [`https://cumbuco.net.br/`, `${canonicalOrigin}/`],
    [`http://www.cumbuco.net.br/`, `${canonicalOrigin}/`],
    [`${canonicalOrigin}/properties/beach-sun-cumbuco-2/`, "/properties/beach-sun-cumbuco/"],
    [`${canonicalOrigin}/properties/villa-priscila/`, "/properties/"],
  ]) {
    const response = await fetch(url, { redirect: "manual" });
    const location = response.headers.get("location");
    redirectChecks.push({ url, status: response.status, location, expected });
    if (![301, 308].includes(response.status) || location !== expected) {
      issues.push(`Redirect mismatch: ${url} -> ${response.status} ${location || "missing"}; expected ${expected}`);
    }
  }
}

const result = {
  targetOrigin,
  canonicalOrigin,
  isPreview,
  pages: pages.length,
  internalUrls: internalUrls.size,
  images: images.size,
  robotsStatus: robots.response.status,
  llmsStatus: llms.response.status,
  securityHeaders,
  previewRobotsHeader,
  redirectChecks,
  pageSummaries,
  issues,
};

console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
