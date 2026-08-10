import { copyFile, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const contentRoot = path.join(root, "src", "content", "properties");
const extracted = JSON.parse(await readFile(path.join(root, "migration", "extracted-properties-br.json"), "utf8"));
const aliases = new Map([["dunas-village-cumbuco", "dunas-village"]]);

function localLegacyImage(sourceUrl) {
  const pathname = decodeURIComponent(new URL(sourceUrl).pathname);
  const match = pathname.match(/\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^/?#]+)$/i);
  if (!match) throw new Error(`Unsupported legacy image: ${sourceUrl}`);
  return path.join(root, "public", "images", "legacy-br", match[1], match[2], match[3]);
}

function metaDescription(property) {
  const summary = property.descriptionText.replace(/\s+/g, " ").trim();
  const lead = summary.length > 128 ? `${summary.slice(0, 125).replace(/\s+\S*$/, "")}…` : summary;
  return `${lead} Consulte disponibilidade pelo WhatsApp.`.slice(0, 165);
}

for (const property of extracted) {
  const sourceSlug = aliases.get(property.slug) || property.slug;
  const sourcePath = path.join(contentRoot, `${sourceSlug}.json`);
  let current;
  try {
    current = JSON.parse(await readFile(sourcePath, "utf8"));
  } catch {
    current = null;
  }

  if (current) {
    const updated = {
      ...current,
      slug: property.slug,
      postId: property.postId || current.postId,
      title: property.title,
      canonical: `https://www.cumbuco.net.br/properties/${property.slug}/`,
      legacyUrl: property.url,
      seo: {
        title: `${property.title} | Aluguel por temporada em Cumbuco`,
        description: metaDescription(property),
        modified: "2026-08-10T00:00:00-03:00",
        ogImage: current.gallery[0]?.src || "",
      },
      descriptionHtml: property.descriptionHtml,
      descriptionText: property.descriptionText,
      features: property.features,
      youtubeId: property.youtubeId || current.youtubeId,
    };
    const targetPath = path.join(contentRoot, `${property.slug}.json`);
    await writeFile(targetPath, `${JSON.stringify(updated, null, 2)}\n`);
    if (targetPath !== sourcePath) await unlink(sourcePath);
    continue;
  }

  if (property.slug !== "jardim-reale-cumbuco") continue;
  const originals = path.join(root, "public", "images", "properties", property.slug, "originals");
  await mkdir(originals, { recursive: true });
  const gallery = [];
  for (const sourceUrl of property.gallery) {
    const source = localLegacyImage(sourceUrl);
    const fileName = path.basename(source);
    const target = path.join(originals, fileName);
    await copyFile(source, target);
    gallery.push({ src: `/images/properties/${property.slug}/originals/${fileName}`, sourceUrl });
  }
  const created = {
    slug: property.slug,
    postId: property.postId,
    title: property.title,
    canonical: `https://www.cumbuco.net.br/properties/${property.slug}/`,
    legacyUrl: property.url,
    seo: {
      title: `${property.title} | Apartamento para alugar em Cumbuco`,
      description: metaDescription(property),
      modified: "2026-08-10T00:00:00-03:00",
      ogImage: gallery[0]?.src || "",
    },
    descriptionHtml: property.descriptionHtml,
    descriptionText: property.descriptionText,
    propertyType: "apartment",
    rentalType: "entire-home",
    taxonomy: [],
    metrics: property.metrics,
    details: {
      "Property ID": property.postId,
      "Property Size": property.size,
      "Check-in Hour": property.checkIn,
      "Check-Out Hour": property.checkOut,
    },
    features: property.features,
    coordinates: property.coordinates,
    youtubeId: property.youtubeId,
    gallery,
    reservedDates: [],
  };
  await writeFile(path.join(contentRoot, `${property.slug}.json`), `${JSON.stringify(created, null, 2)}\n`);
}

console.log(`Prepared ${extracted.length} Brazilian property records, including Jardim Reale.`);
