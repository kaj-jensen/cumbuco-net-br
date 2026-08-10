import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const rawRoot = path.join(root, "migration", "raw-br");
const site = JSON.parse(await readFile(path.join(rawRoot, "site-export.json"), "utf8"));

const entities = (value = "") => value
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#039;", "'")
  .replaceAll("&nbsp;", " ")
  .replaceAll("&aacute;", "á")
  .replaceAll("&atilde;", "ã")
  .replaceAll("&ccedil;", "ç");

const text = (html = "") => entities(html)
  .replace(/<br\s*\/?>/gi, "\n")
  .replace(/<\/p>/gi, "\n\n")
  .replace(/<[^>]+>/g, " ")
  .replace(/[ \t]+/g, " ")
  .replace(/\n\s+/g, "\n")
  .trim();

const capture = (html, expression) => html.match(expression)?.[1]?.trim() || "";
const integer = (value) => value ? Number.parseInt(value, 10) : null;

function originalImage(url) {
  const parsed = new URL(entities(url));
  parsed.pathname = parsed.pathname.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, "");
  return parsed.href;
}

function detail(html, className) {
  return text(capture(html, new RegExp(`class=["'][^"']*${className}[^"']*["'][^>]*>[\\s\\S]*?<span[^>]*>[^<]*<\\/span>([\\s\\S]*?)<\\/div>`, "i")));
}

const brazilian = [];
for (const page of site.pages.filter(({ kind }) => kind === "property")) {
  const html = await readFile(path.join(rawRoot, page.snapshot), "utf8");
  const slug = page.pathname.split("/").filter(Boolean).at(-1);
  const gallery = [...new Set([...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]+alt=["']slider["']/gi)]
    .map((match) => originalImage(match[1])))];
  const descriptionHtml = capture(html, /<div id=["']listing_description["']>[\s\S]*?<div class=["']panel-body["'][^>]*itemprop=["']description["']>([\s\S]*?)<\/div>\s*<\/div>/i);
  const header = capture(html, /<div class=["']category_wrapper[^"']*["']>([\s\S]*?)<div id=["']listing_description["']/i);
  const amenities = capture(html, /id=["']listing_ammenities["']([\s\S]*?)<div class=["']property_page_container/i);
  const youtube = capture(html, /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/i) || null;
  const latitude = capture(html, /(?:listing_lat|property_lat)["']?\s*[:=]\s*["'](-?\d+(?:\.\d+)?)/i);
  const longitude = capture(html, /(?:listing_long|property_long)["']?\s*[:=]\s*["'](-?\d+(?:\.\d+)?)/i);

  brazilian.push({
    slug,
    url: page.url,
    title: page.h1 || page.title.split(" • ")[0],
    seo: { title: page.title, description: page.description, canonical: page.canonical, ogImage: page.ogImage },
    propertyType: text(capture(header, /\/listings\/[^/]+\/[^>]*>([^<]+)/i)).toLowerCase(),
    metrics: {
      guests: integer(capture(header, /(\d+)\s+Pessoas/i)),
      bedrooms: integer(capture(header, /(\d+)\s+Quartos/i)),
      baths: integer(capture(header, /(\d+)\s+Banheiros/i)),
    },
    postId: detail(html, "list_detail_prop_id"),
    size: detail(html, "list_detail_prop_size"),
    checkIn: detail(html, "list_detail_prop_check-in"),
    checkOut: detail(html, "list_detail_prop_check-out"),
    descriptionHtml,
    descriptionText: text(descriptionHtml),
    features: [...amenities.matchAll(/checkon[^>]*><\/i>([^<]+)/gi)].map((match) => text(match[1])),
    coordinates: latitude && longitude ? { latitude: Number(latitude), longitude: Number(longitude) } : null,
    youtubeId: youtube,
    gallery,
  });
}

const englishFiles = (await readdir(path.join(root, "src", "content", "properties"))).filter((file) => file.endsWith(".json"));
const english = await Promise.all(englishFiles.map(async (file) => JSON.parse(await readFile(path.join(root, "src", "content", "properties", file), "utf8"))));
const aliases = new Map([["dunas-village-cumbuco", "dunas-village"]]);
const englishBySlug = new Map(english.map((property) => [property.slug, property]));
const rows = brazilian.map((property) => {
  const englishSlug = aliases.get(property.slug) || property.slug;
  const counterpart = englishBySlug.get(englishSlug);
  return {
    property: property.title,
    brazilianSlug: property.slug,
    englishSlug: counterpart?.slug || null,
    br: property.metrics,
    en: counterpart?.metrics || null,
    brImages: property.gallery.length,
    enImages: counterpart?.gallery.length || 0,
    status: counterpart ? "shared" : "brazil-only",
  };
});
for (const property of english) {
  if (!rows.some(({ englishSlug }) => englishSlug === property.slug)) {
    rows.push({
      property: property.title,
      brazilianSlug: null,
      englishSlug: property.slug,
      br: null,
      en: property.metrics,
      brImages: 0,
      enImages: property.gallery.length,
      status: "english-only",
    });
  }
}

const metric = (value) => value == null ? "—" : `${value.guests}/${value.bedrooms}/${value.baths}`;
const markdown = `# Inventário comparativo de imóveis\n\nGerado em ${new Date().toISOString().slice(0, 10)}. Os números em “capacidade” são hóspedes/quartos/banheiros. Decisão do proprietário em 2026-08-10: para todos os imóveis compartilhados, o cadastro inglês é a fonte oficial de capacidade, quartos, banheiros, área, horários, comodidades e demais especificações. Jardim Reale permanece com os dados brasileiros por não possuir cadastro inglês.\n\n| Imóvel | URL brasileira | URL inglesa | Capacidade BR | Capacidade EN | Fotos BR | Fotos EN | Situação |\n| --- | --- | --- | ---: | ---: | ---: | ---: | --- |\n${rows.map((row) => `| ${row.property} | ${row.brazilianSlug || "—"} | ${row.englishSlug || "—"} | ${metric(row.br)} | ${metric(row.en)} | ${row.brImages} | ${row.enImages} | ${row.status} |`).join("\n")}\n\n## Regras para a migração\n\n- Preservar todas as URLs brasileiras de imóveis que permanecerem ativas.\n- Redirecionar uma URL somente depois de confirmar que o imóvel foi removido, renomeado ou consolidado.\n- Quando os números divergirem, usar o cadastro inglês. Para Jardim Reale, usar o cadastro brasileiro até existir uma contraparte inglesa.\n- Manter as imagens originais com proveniência; escolher e otimizar derivados apenas na etapa visual.\n- Não publicar preços, taxas ou disponibilidade histórica sem confirmação atual.\n`;

await writeFile(path.join(root, "migration", "extracted-properties-br.json"), `${JSON.stringify(brazilian, null, 2)}\n`);
await writeFile(path.join(root, "migration", "property-reconciliation-br.json"), `${JSON.stringify(rows, null, 2)}\n`);
await writeFile(path.join(root, "docs", "property-reconciliation-br.md"), markdown);

console.log(`Compared ${brazilian.length} Brazilian properties with ${english.length} English properties.`);
