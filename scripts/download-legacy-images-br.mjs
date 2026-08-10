import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const exportPath = path.join(root, "migration", "raw-br", "site-export.json");
const source = JSON.parse(await readFile(exportPath, "utf8"));
const urls = [...new Set(source.pages
  .flatMap(({ images }) => images)
  .filter((url) => /\/wp-content\/uploads\/\d{4}\/\d{2}\/[^/?#]+$/i.test(new URL(url).pathname)))].sort();
const outputRoot = path.join(root, "public", "images", "legacy-br");
const failures = [];

function outputPath(url) {
  const pathname = decodeURIComponent(new URL(url).pathname);
  const match = pathname.match(/\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^/?#]+)$/i);
  if (!match) throw new Error(`Unsupported upload URL: ${url}`);
  return path.join(outputRoot, match[1], match[2], match[3]);
}

async function download(url, index) {
  const target = outputPath(url);
  await mkdir(path.dirname(target), { recursive: true });
  const response = await fetch(url, {
    headers: { "user-agent": "CumbucoNetBrMigration/1.0 (+https://www.cumbuco.net.br/)" },
  });
  if (!response.ok) {
    failures.push({ url, status: response.status });
    process.stdout.write(`Missing ${response.status}: ${url}\n`);
    return;
  }
  await writeFile(target, new Uint8Array(await response.arrayBuffer()));
  process.stdout.write(`Downloaded ${index + 1}/${urls.length}: ${path.relative(root, target)}\n`);
}

const concurrency = 6;
for (let offset = 0; offset < urls.length; offset += concurrency) {
  await Promise.all(urls.slice(offset, offset + concurrency).map((url, index) => download(url, offset + index)));
}

await writeFile(path.join(root, "migration", "legacy-image-download-br.json"), `${JSON.stringify({
  source: source.source,
  attempted: urls.length,
  downloaded: urls.length - failures.length,
  failures,
}, null, 2)}\n`);

console.log(`Downloaded ${urls.length - failures.length}/${urls.length} legacy image files.`);
if (failures.length) process.exitCode = 1;
