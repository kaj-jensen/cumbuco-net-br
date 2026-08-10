import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const properties = JSON.parse(
  await readFile(path.join(root, "migration/raw/properties.json"), "utf8"),
);
const pages = JSON.parse(
  await readFile(path.join(root, "migration/raw/pages.json"), "utf8"),
);

const propertyOutput = path.join(root, "src/content/properties");
const pageOutput = path.join(root, "src/content/pages");
await mkdir(propertyOutput, { recursive: true });
await mkdir(pageOutput, { recursive: true });

function localImagePath(slug, sourceUrl) {
  const url = new URL(sourceUrl);
  const match = url.pathname.match(/\/uploads\/(\d{4})\/(\d{2})\/([^/]+)$/);
  if (!match) throw new Error(`Unsupported WordPress image URL: ${sourceUrl}`);

  const [, year, month, encodedName] = match;
  return `/images/properties/${slug}/originals/${year}-${month}-${decodeURIComponent(encodedName)}`;
}

function normalizedUrl(sourceUrl) {
  const url = new URL(sourceUrl);
  return decodeURIComponent(url.pathname).normalize("NFC");
}

function taxonomySlug(property, group) {
  const item = property.taxonomy.find(({ url }) => url.includes(`/${group}/`));
  if (!item) throw new Error(`Missing ${group} taxonomy for ${property.slug}`);
  return new URL(item.url).pathname.split("/").filter(Boolean).at(-1);
}

let sourceImageReferences = 0;
let duplicateImageReferences = 0;
const migratedProperties = [];

for (const property of properties) {
  sourceImageReferences += property.gallery.length;
  const seen = new Set();
  const gallery = [];

  for (const sourceUrl of property.gallery) {
    const key = normalizedUrl(sourceUrl);
    if (seen.has(key)) {
      duplicateImageReferences += 1;
      continue;
    }

    seen.add(key);
    const src = localImagePath(property.slug, sourceUrl);
    await access(path.join(root, "public", ...src.split("/").filter(Boolean)));
    gallery.push({
      src,
      sourceUrl,
    });
  }

  const migrated = {
    ...property,
    legacyUrl: property.url,
    propertyType: taxonomySlug(property, "listings"),
    rentalType: taxonomySlug(property, "action"),
    gallery,
  };
  delete migrated.url;
  migratedProperties.push(migrated);
  await writeFile(
    path.join(propertyOutput, `${property.slug}.json`),
    `${JSON.stringify(migrated, null, 2)}\n`,
  );
}

for (const page of pages) {
  const migrated = { ...page, legacyUrl: page.url };
  delete migrated.url;
  await writeFile(
    path.join(pageOutput, `${page.slug}.json`),
    `${JSON.stringify(migrated, null, 2)}\n`,
  );
}

const legacyRoutes = [
  "/",
  "/about-us/",
  "/contact-cumbuco-rentals/",
  "/terms-and-conditions/",
  "/privacy-cookies/",
  "/city/cumbuco/",
  "/listings/apartment/",
  "/listings/house/",
  "/listings/villa/",
  "/action/apartment/",
  "/action/entire-home/",
  "/page/2/",
  ...migratedProperties.map(({ slug }) => `/properties/${slug}/`),
];

const report = {
  source: "https://www.cumbuco.net",
  properties: migratedProperties.length,
  pages: pages.length,
  sourceImageReferences,
  duplicateImageReferences,
  logicalPropertyImages: sourceImageReferences - duplicateImageReferences,
  propertyTypes: Object.fromEntries(
    ["apartment", "house", "villa"].map((type) => [
      type,
      migratedProperties.filter((property) => property.propertyType === type).length,
    ]),
  ),
  propertyImagesBySlug: Object.fromEntries(
    migratedProperties.map(({ slug, gallery }) => [slug, gallery.length]),
  ),
  legacyRoutes,
  notes: [
    "Property content was extracted from the rendered public WordPress pages.",
    "Gallery files are original WordPress uploads, not thumbnails.",
    "Casa Chick contained two differently encoded references to the same image; the duplicate is intentionally removed.",
    "The legacy route list is retained for URL parity and redirect planning.",
  ],
};

await writeFile(
  path.join(root, "migration/inventory.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

console.log(
  `Prepared ${report.properties} properties, ${report.pages} pages, and ${report.logicalPropertyImages} property images.`,
);
