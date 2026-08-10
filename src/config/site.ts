export const site = {
  name: "Cumbuco Aluguéis por Temporada",
  shortName: "Cumbuco Aluguéis",
  url: "https://www.cumbuco.net.br",
  phone: "+55 85 98813 9402",
  email: "info@cumbuco.net.br",
  description:
    "Casas, apartamentos e villas para aluguel por temporada, com um guia local de Cumbuco, Ceará.",
  locale: "pt-BR",
  primaryNavigation: [
    {
      label: "Aluguéis",
      href: "/properties/",
      children: [
        { label: "Todos os imóveis", href: "/properties/" },
        { label: "Apartamentos", href: "/listings/apartment/" },
        { label: "Casas", href: "/listings/house/" },
        { label: "Villas", href: "/listings/villa/" },
      ],
    },
    {
      label: "Guia de Cumbuco",
      href: "/city/cumbuco/",
      children: [
        { label: "Visão geral", href: "/city/cumbuco/" },
        { label: "Onde ficar", href: "/city/cumbuco/where-to-stay/" },
        { label: "Restaurantes", href: "/city/cumbuco/restaurants/" },
        { label: "O que fazer", href: "/city/cumbuco/things-to-do/" },
        { label: "Praias e lagoas", href: "/city/cumbuco/beaches/" },
        { label: "Kitesurf", href: "/city/cumbuco/kiteboarding/" },
        { label: "Planeje sua viagem", href: "/city/cumbuco/travel-information/" },
        { label: "Guia local", href: "/city/cumbuco/local-businesses/" },
      ],
    },
    { label: "Anuncie seu imóvel", href: "/list-your-property/" },
    { label: "Sobre", href: "/about-us/" },
    { label: "Contato", href: "/contact-cumbuco-rentals/" },
  ],
  footerNavigation: [
    { label: "Termos e condições", href: "/terms-and-conditions/" },
    { label: "Privacidade e cookies", href: "/privacy-cookies/" },
    { label: "Anuncie seu imóvel", href: "/list-your-property/" },
    { label: "Parceiros", href: "/featured-partners/" },
  ],
} as const;

export type PropertyType = "apartment" | "house" | "villa";

// Launch catalogue: preserves every property currently published on cumbuco.net.br.
// English-only additions remain in source for owner review but are not rendered yet.
export const brazilianPropertySlugs = new Set([
  "beach-sun-cumbuco",
  "casa-chick",
  "casa-vermelha",
  "dream-village-301-h",
  "dream-village-301-v",
  "dream-village-401-h",
  "dunas-village-cumbuco",
  "jardim-reale-cumbuco",
  "villa-branca",
]);

export const propertyDisplayOrder = [
  "villa-branca",
  "casa-chick",
  "casa-vermelha",
  "dream-village-301-v",
  "dunas-village-cumbuco",
  "dream-village-401-h",
  "jardim-reale-cumbuco",
  "dream-village-301-h",
  "beach-sun-cumbuco",
] as const;

export const comparePropertyEntries = (a: any, b: any) => {
  const aSlug = a.data?.slug ?? a.slug;
  const bSlug = b.data?.slug ?? b.slug;
  const aIndex = propertyDisplayOrder.indexOf(aSlug);
  const bIndex = propertyDisplayOrder.indexOf(bSlug);
  return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex);
};
