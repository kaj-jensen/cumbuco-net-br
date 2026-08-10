import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, "migration", "authoritative-property-facts.json"), "utf8"));
const failures = [];

for (const [slug, expected] of Object.entries(manifest.properties)) {
  const file = path.join(root, "src", "content", "properties", `${slug}.json`);
  const property = JSON.parse(await readFile(file, "utf8"));
  const actual = {
    guests: property.metrics?.guests,
    bedrooms: property.metrics?.bedrooms,
    baths: property.metrics?.baths,
    size: property.details?.["Property Size"],
    checkIn: property.details?.["Check-in Hour"],
    checkOut: property.details?.["Check-Out Hour"],
  };

  for (const key of ["guests", "bedrooms", "baths", "size", "checkIn", "checkOut"]) {
    if (actual[key] !== expected[key]) {
      failures.push(`${slug}.${key}: expected ${JSON.stringify(expected[key])}, received ${JSON.stringify(actual[key])}`);
    }
  }
}

if (failures.length) {
  console.error("Property facts differ from the approved source:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Verified authoritative facts for ${Object.keys(manifest.properties).length} Brazilian properties.`);
}
