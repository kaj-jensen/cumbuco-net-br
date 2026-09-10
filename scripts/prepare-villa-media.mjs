import sharp from 'sharp';
import fs from 'node:fs/promises';
// Run with a local input manifest: [sourcePath, descriptiveSlug, EnglishAlt, PortugueseAlt].
const manifest = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
const output = 'public/images/properties/villa-branca/2026';
await fs.mkdir(output, { recursive: true });
const result = [];
for (const [source, name, en, pt] of manifest) {
 const base = `${output}/villa-branca-cumbuco-${name}`;
 const original = await fs.stat(source);
 const full = await sharp(source).rotate().resize({width:1280,withoutEnlargement:true}).webp({quality:80,effort:6}).toFile(`${base}.webp`);
 const small = await sharp(source).rotate().resize({width:640,withoutEnlargement:true}).webp({quality:78,effort:6}).toFile(`${base}-640.webp`);
 result.push({src:`/${base.slice(7)}.webp`,srcset:`/${base.slice(7)}-640.webp ${small.width}w, /${base.slice(7)}.webp ${full.width}w`,width:full.width,height:full.height,en,pt,originalBytes:original.size,optimizedBytes:full.size});
}
console.log(JSON.stringify(result,null,2));
