import { access, readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const issues = [];
const warnings = [];
const metadata = [];

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

function match(html, expression) {
  return html.match(expression)?.[1]?.trim() || "";
}

function collectTypes(value, types = new Set()) {
  if (!value || typeof value !== "object") return types;
  if (Array.isArray(value)) {
    for (const item of value) collectTypes(item, types);
    return types;
  }
  const type = value["@type"];
  for (const item of Array.isArray(type) ? type : [type]) if (item) types.add(item);
  for (const item of Object.values(value)) collectTypes(item, types);
  return types;
}

for (const file of await htmlFiles(root)) {
  const html = await readFile(file, "utf8");
  const path = relative(root, file).replaceAll("\\", "/");
  const title = match(html, /<title>(.*?)<\/title>/is);
  const description = match(html, /<meta name="description" content="([^"]*)"/i);
  const canonical = match(html, /<link rel="canonical" href="([^"]*)"/i);
  const robots = match(html, /<meta name="robots" content="([^"]*)"/i);
  const ogImage = match(html, /<meta property="og:image" content="([^"]*)"/i);
  const h1Count = (html.match(/<h1(?:\s|>)/gi) || []).length;
  const missingAlt = (html.match(/<img\b(?![^>]*\balt=)[^>]*>/gi) || []).length;
  const unsafeBlankLinks = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)]
    .filter(([tag]) => !/rel="[^"]*noopener/i.test(tag)).length;
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gis)];
  const graph = [];

  if (!title) issues.push(`${path}: missing title`);
  if (!description) issues.push(`${path}: missing meta description`);
  if (!canonical) issues.push(`${path}: missing canonical URL`);
  if (!robots.includes("index") || !robots.includes("max-image-preview:large")) issues.push(`${path}: incomplete robots directive`);
  if (!ogImage) issues.push(`${path}: missing Open Graph image`);
  if (h1Count !== 1) issues.push(`${path}: expected one H1, found ${h1Count}`);
  if (missingAlt) issues.push(`${path}: ${missingAlt} image(s) missing alt text`);
  if (unsafeBlankLinks) issues.push(`${path}: ${unsafeBlankLinks} target-blank link(s) missing noopener`);
  if (!html.includes('class="skip-link"') || !html.includes('id="main-content"')) issues.push(`${path}: missing skip navigation contract`);
  if (title.length > 65) warnings.push(`${path}: title is ${title.length} characters`);
  if (description.length < 100 || description.length > 170) warnings.push(`${path}: description is ${description.length} characters`);

  for (const script of scripts) {
    try {
      const value = JSON.parse(script[1]);
      graph.push(...(Array.isArray(value["@graph"]) ? value["@graph"] : [value]));
    } catch (error) {
      issues.push(`${path}: invalid JSON-LD (${error.message})`);
    }
  }

  const types = collectTypes(graph);
  for (const required of ["WebSite", "WebPage", "LodgingBusiness"]) {
    if (!types.has(required)) issues.push(`${path}: missing ${required} structured data`);
  }
  if (path.startsWith("properties/") && path !== "properties/index.html") {
    if (!types.has("BreadcrumbList")) issues.push(`${path}: missing property breadcrumb structured data`);
    if (!types.has("Apartment") && !types.has("House")) issues.push(`${path}: missing accommodation structured data`);
  }
  if (path === "city/cumbuco/local-businesses/index.html") {
    for (const required of ["CollectionPage", "ItemList", "BreadcrumbList", "LocalBusiness"]) {
      if (!types.has(required) && required !== "LocalBusiness") issues.push(`${path}: missing ${required} directory data`);
    }
  }

  metadata.push({ path, title, description, canonical, types: [...types] });
}

for (const field of ["title", "description", "canonical"]) {
  const values = new Map();
  for (const page of metadata) {
    if (!page[field]) continue;
    const existing = values.get(page[field]);
    if (existing) issues.push(`duplicate ${field}: ${existing} and ${page.path}`);
    else values.set(page[field], page.path);
  }
}

try {
  await access(join(root, "llms.txt"));
  const llms = await readFile(join(root, "llms.txt"), "utf8");
  if (!/^#\s+\S+/m.test(llms)) issues.push("llms.txt: missing H1 heading");
  if (!/https:\/\/www\.cumbuco\.net\.br\//.test(llms)) issues.push("llms.txt: missing canonical site links");
} catch {
  issues.push("missing llms.txt");
}

console.log(JSON.stringify({ pages: metadata.length, issues, warnings }, null, 2));
if (issues.length) process.exitCode = 1;
