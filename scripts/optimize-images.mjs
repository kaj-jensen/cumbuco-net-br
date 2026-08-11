import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const propertiesRoot = path.join(root, "public/images/properties");
const optimizedRoot = path.join(root, "public/images/optimized");
const destinationRoot = path.join(root, "public/images/content/cumbuco");

const editorialSources = [
  { source: "cumbuco-palms-pexels-original.jpg", output: "cumbuco-palms", widths: [720, 1200] },
  { source: "cumbuco-palms-ocean-pexels-original.jpg", output: "cumbuco-palms-ocean", widths: [720, 1200] },
  { source: "cumbuco-palms-sand-pexels-original.jpg", output: "cumbuco-palms-sand", widths: [720, 1200] },
  { source: "cumbuco-dune-buggy-pexels-original.jpg", output: "cumbuco-dune-buggy", widths: [900, 1800] },
  { source: "local-beach-original.jpg", output: "local-beach", widths: [720, 1440] },
  { source: "local-kitesurf-original.jpg", output: "local-kitesurf", widths: [720, 1440] },
  { source: "local-buggy-original.jpg", output: "local-buggy", widths: [720, 1440] },
  { source: "local-accommodation-original.jpg", output: "local-accommodation", widths: [720, 1440] },
  { source: "local-travel-original.jpg", output: "local-travel", widths: [720, 1440] },
  { source: "local-businesses-original.jpg", output: "local-businesses", widths: [720, 1440] },
  { source: "local-partners-original.jpg", output: "local-partners", widths: [720, 1440] },
  { source: "local-about-original.jpg", output: "local-about", widths: [720, 1440] },
  { source: "local-home-kite-original.jpg", output: "local-home-kite", widths: [720, 1440] },
  { source: "local-home-caipirinha-original.jpg", output: "local-home-caipirinha", widths: [540, 900] },
];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(location));
    else files.push(location);
  }

  return files;
}

const cardImages = (await filesIn(propertiesRoot))
  .filter((file) => /-card(?:-480)?\.jpg$/i.test(file));
const heroImages = (await filesIn(optimizedRoot))
  .filter((file) => /home-hero-(?:800|1600)\.jpg$/i.test(file));
const destinationImages = (await filesIn(destinationRoot))
  .filter((file) => /-(?:720|1440)\.jpg$/i.test(file));
const sourceImages = [...heroImages, ...destinationImages, ...cardImages];

for (const image of editorialSources) {
  const source = image.source.startsWith("local-")
    ? path.join(root, "assets/images/content/cumbuco", image.source)
    : path.join(destinationRoot, image.source);

  for (const width of image.widths) {
    const output = path.join(destinationRoot, `${image.output}-${width}`);
    const resized = sharp(source).resize({ width, withoutEnlargement: true });

    await Promise.all([
      resized.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(`${output}.jpg`),
      resized.clone().avif({ quality: 50, effort: 5 }).toFile(`${output}.avif`),
      resized.clone().webp({ quality: 78, effort: 5 }).toFile(`${output}.webp`),
    ]);
  }
}

for (const source of sourceImages) {
  const base = source.replace(/\.jpg$/i, "");
  await Promise.all([
    sharp(source).avif({ quality: 50, effort: 5 }).toFile(`${base}.avif`),
    sharp(source).webp({ quality: 78, effort: 5 }).toFile(`${base}.webp`),
  ]);
}

console.log(`Created responsive editorial images and AVIF/WebP variants for ${sourceImages.length} existing images.`);
