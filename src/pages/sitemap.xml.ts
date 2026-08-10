import { getCollection } from "astro:content";
import { brazilianPropertySlugs } from "../config/site";

export const prerender = true;

const escapeXml = (value: string) =>
  value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character] || character);

export async function GET({ site }: { site: URL }) {
  const [properties, pages] = await Promise.all([
    getCollection("properties", ({ data }) => brazilianPropertySlugs.has(data.slug)),
    getCollection("pages"),
  ]);
  const fixedRoutes = [
    "/",
    "/properties/",
    "/city/cumbuco/",
    "/city/cumbuco/where-to-stay/",
    "/city/cumbuco/restaurants/",
    "/city/cumbuco/things-to-do/",
    "/city/cumbuco/beaches/",
    "/city/cumbuco/kiteboarding/",
    "/city/cumbuco/travel-information/",
    "/city/cumbuco/local-businesses/",
    "/featured-partners/",
    "/list-your-property/",
    "/listings/apartment/",
    "/listings/house/",
    "/listings/villa/",
    "/action/apartment/",
    "/action/entire-home/",
  ];
  const paths = [
    ...fixedRoutes,
    ...pages.map(({ data }) => data.slug === "home" ? "/" : `/${data.slug}/`),
    ...properties.map(({ data }) => `/properties/${data.slug}/`),
  ];
  const uniquePaths = [...new Set(paths)].sort((a, b) => a.localeCompare(b));
  const urls = uniquePaths
    .map((path) => `<url><loc>${escapeXml(new URL(path, site).toString())}</loc></url>`)
    .join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
