import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const seo = z.object({
  title: z.string(),
  description: z.string(),
  modified: z.string(),
  ogImage: z.string(),
});

const destinationImage = z.object({
  src: z.string().regex(/^\/images\//),
  alt: z.string().min(10),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  credit: z.string().optional(),
  sourceUrl: z.string().url().optional(),
});

const publicationStatus = z.enum(["draft", "published", "archived"]);

const guides = defineCollection({
  loader: glob({ base: "./src/content", pattern: "guides/**/*.json" }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    route: z.string().regex(/^\/city\/cumbuco\/(?:[a-z0-9-]+\/)*$/),
    status: publicationStatus,
    topic: z.enum([
      "overview",
      "where-to-stay",
      "restaurants",
      "things-to-do",
      "beaches",
      "kiteboarding",
      "travel-planning",
      "local-businesses",
    ]),
    title: z.string(),
    eyebrow: z.string(),
    summary: z.string(),
    introductionHtml: z.string(),
    hero: destinationImage,
    sections: z.array(z.object({
      id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      title: z.string(),
      bodyHtml: z.string(),
      image: destinationImage.optional(),
      businessCategories: z.array(z.string()).default([]),
    })),
    relatedGuideSlugs: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    order: z.number().int().nonnegative().default(0),
    seo,
  }),
});

const businesses = defineCollection({
  loader: glob({ base: "./src/content", pattern: "businesses/**/*.json" }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    status: publicationStatus,
    name: z.string(),
    category: z.enum([
      "restaurant",
      "cafe",
      "bar",
      "hotel",
      "pousada",
      "beach-club",
      "kite-school",
      "shop",
      "activity",
      "transport",
      "service",
    ]),
    subcategory: z.string().optional(),
    summary: z.string(),
    descriptionHtml: z.string(),
    images: z.array(destinationImage).default([]),
    contact: z.object({
      website: z.string().url().optional(),
      whatsapp: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      googleMaps: z.string().url().optional(),
    }),
    location: z.object({
      area: z.string().default("Cumbuco"),
      address: z.string().optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    }),
    openingHours: z.array(z.string()).default([]),
    priceRange: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featuredPartner: z.boolean().default(false),
    featuredPriority: z.number().int().nonnegative().default(0),
    verifiedAt: z.string(),
    seo,
  }),
});

const properties = defineCollection({
  loader: glob({ base: "./src/content/properties", pattern: "**/*.json" }),
  schema: z.object({
    slug: z.string(),
    postId: z.string(),
    title: z.string(),
    canonical: z.string().url(),
    legacyUrl: z.string().url(),
    seo,
    descriptionHtml: z.string(),
    descriptionText: z.string(),
    propertyType: z.enum(["apartment", "house", "villa"]),
    rentalType: z.enum(["apartment", "entire-home"]),
    taxonomy: z.array(z.object({ label: z.string(), url: z.string().url() })),
    occupancyLabel: z.string().optional(),
    metrics: z.object({
      bedrooms: z.number().nullable(),
      baths: z.number().nullable(),
      guests: z.number().nullable(),
    }),
    details: z.record(z.string(), z.string()),
    features: z.array(z.string()),
    coordinates: z
      .object({ latitude: z.number(), longitude: z.number() })
      .nullable(),
    youtubeId: z.string().nullable(),
    gallery: z.array(
      z.object({ src: z.string(), sourceUrl: z.string().url().optional(), alt: z.string().optional(), srcset: z.string().optional(), width: z.number().int().positive().optional(), height: z.number().int().positive().optional() }),
    ),
    videos: z.array(z.object({
      src: z.string(), poster: z.string(), title: z.string(), description: z.string(),
      duration: z.string(), uploadDate: z.string(), width: z.number(), height: z.number(),
    })).default([]),
    reservedDates: z.array(z.string()),
  }),
});

const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.json" }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    canonical: z.string().url(),
    legacyUrl: z.string().url(),
    seo,
    contentHtml: z.string(),
    contentText: z.string(),
    images: z.array(z.string()),
    form: z.unknown().nullable(),
    contact: z.unknown().optional(),
  }),
});

export const collections = { businesses, guides, pages, properties };
