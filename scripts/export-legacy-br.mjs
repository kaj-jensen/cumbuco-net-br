import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const origin = "https://www.cumbuco.net.br";
const root = process.cwd();
const output = path.join(root, "migration", "raw-br");
const htmlOutput = path.join(output, "html");

await mkdir(htmlOutput, { recursive: true });

const decode = (value = "") => value
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#039;", "'")
  .replaceAll("&#8211;", "–")
  .replaceAll("&#8226;", "•")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">");

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "CumbucoNetBrMigration/1.0 (+https://www.cumbuco.net.br/)" },
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "CumbucoNetBrMigration/1.0 (+https://www.cumbuco.net.br/)" },
  });
  return { status: response.status, html: await response.text() };
}

function locs(xml) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/gis)].map((match) => decode(match[1].trim()));
}

function match(html, expression) {
  return decode(html.match(expression)?.[1]?.trim() || "");
}

function absoluteUrl(value) {
  try {
    return new URL(decode(value), origin).href;
  } catch {
    return null;
  }
}

function imageUrls(html) {
  const candidates = [
    ...[...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map((match) => match[1]),
    ...[...html.matchAll(/srcset=["']([^"']+)["']/gi)]
      .flatMap((match) => match[1].split(",").map((entry) => entry.trim().split(/\s+/)[0])),
  ];
  return [...new Set(candidates
    .map(absoluteUrl)
    .filter((url) => {
      if (!url) return false;
      const parsed = new URL(url);
      return parsed.hostname === "www.cumbuco.net.br" && parsed.pathname.includes("/wp-content/uploads/");
    })
    .map((url) => url.replace(/-\d+x\d+(?=\.[a-z0-9]+(?:\?|$))/i, "")))];
}

function fileName(url, index) {
  const pathname = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  const safe = pathname.replaceAll("/", "__").replace(/[^a-z0-9_.-]+/gi, "-");
  return `${String(index + 1).padStart(3, "0")}__${safe || "home"}.html`;
}

const sitemapIndexUrl = `${origin}/sitemap_index.xml`;
const sitemapUrls = locs(await fetchText(sitemapIndexUrl));
const sitemapRecords = [];
const pageUrls = new Set([`${origin}/`]);

for (const sitemapUrl of sitemapUrls) {
  const xml = await fetchText(sitemapUrl);
  const urls = locs(xml);
  sitemapRecords.push({ url: sitemapUrl, urls });
  for (const url of urls) pageUrls.add(url);
}

const pages = [];
for (const [index, url] of [...pageUrls].sort().entries()) {
  const { status, html } = await fetchPage(url);
  const pathname = new URL(url).pathname;
  const record = {
    url,
    status,
    pathname,
    kind: /^\/properties\/[^/]+\/$/.test(pathname) ? "property" : "page-or-taxonomy",
    title: match(html, /<title>(.*?)<\/title>/is),
    h1: match(html, /<h1[^>]*>(.*?)<\/h1>/is).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    canonical: match(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i),
    description: match(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i),
    robots: match(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)/i),
    ogImage: match(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)/i),
    images: imageUrls(html),
    snapshot: `html/${fileName(url, index)}`,
  };
  pages.push(record);
  await writeFile(path.join(output, record.snapshot), html);
  process.stdout.write(`Exported ${index + 1}/${pageUrls.size}: ${status} ${pathname}\n`);
}

const exportRecord = {
  source: origin,
  exportedAt: new Date().toISOString(),
  sitemapIndexUrl,
  sitemaps: sitemapRecords,
  pages,
};

await writeFile(path.join(output, "site-export.json"), `${JSON.stringify(exportRecord, null, 2)}\n`);
await writeFile(path.join(root, "migration", "legacy-inventory-br.json"), `${JSON.stringify({
  source: origin,
  exportedAt: exportRecord.exportedAt,
  sitemapCount: sitemapRecords.length,
  indexedUrlCount: pages.length,
  propertyCount: pages.filter(({ kind }) => kind === "property").length,
  imageReferenceCount: new Set(pages.flatMap(({ images }) => images)).size,
  routes: pages.map(({ pathname, status, kind, title, canonical, description, robots }) => ({
    pathname,
    status,
    kind,
    title,
    canonical,
    description,
    robots,
  })),
}, null, 2)}\n`);

console.log(`Exported ${pages.length} indexed URLs and ${new Set(pages.flatMap(({ images }) => images)).size} unique original image references.`);
