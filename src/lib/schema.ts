/**
 * Centralised schema.org JSON-LD generators.
 *
 * All helpers return plain objects safe to `JSON.stringify` into a
 * `<script type="application/ld+json">` tag. Keep the generated JSON
 * minimal — Google only needs required + recommended fields; extras
 * dilute the signal and bloat HTML.
 */

import {
  APP_NAME,
  APP_DESCRIPTION,
  APP_TAGLINE,
  FSSAI_REGISTRATION_NUMBER,
  SOCIAL_LINKS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
} from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";

// ==================== Helpers ====================

function absoluteUrl(site: string, pathOrUrl: string): string {
  if (!pathOrUrl) return site;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${site}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** Escape "</" so a JSON-LD blob can't break out of a <script> tag. */
export function stringifyJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// ==================== Organization ====================

export function organizationSchema() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${site}#organization`,
    name: APP_NAME,
    alternateName: APP_TAGLINE,
    description: APP_DESCRIPTION,
    url: site,
    logo: absoluteUrl(site, "/images/brand/logo.png"),
    image: absoluteUrl(site, "/images/og-image.jpg"),
    priceRange: "₹₹",
    telephone: SUPPORT_PHONE,
    email: SUPPORT_EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Patna",
      addressRegion: "Bihar",
      postalCode: "800001",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SUPPORT_PHONE,
      email: SUPPORT_EMAIL,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["Hindi", "English"],
    },
    identifier: {
      "@type": "PropertyValue",
      name: "FSSAI Registration",
      value: FSSAI_REGISTRATION_NUMBER,
    },
    sameAs: [
      SOCIAL_LINKS.instagram,
      SOCIAL_LINKS.facebook,
      SOCIAL_LINKS.youtube,
      SOCIAL_LINKS.twitter,
    ],
  };
}

// ==================== WebSite (with sitelinks search box) ====================

export function websiteSchema() {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site}#website`,
    url: site,
    name: APP_NAME,
    description: APP_DESCRIPTION,
    inLanguage: "en-IN",
    publisher: { "@id": `${site}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ==================== Breadcrumbs ====================

export interface BreadcrumbTrailItem {
  label: string;
  href: string; // relative or absolute
}

export function breadcrumbSchema(items: BreadcrumbTrailItem[]) {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: absoluteUrl(site, item.href),
    })),
  };
}

// ==================== FAQ ====================

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]) {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

// ==================== Article ====================

export interface ArticleSchemaInput {
  headline: string;
  description?: string;
  slug: string; // path under /blog/
  images?: string[];
  authorName?: string;
  publishedAt?: Date | string;
  updatedAt?: Date | string;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
}

export function articleSchema(input: ArticleSchemaInput) {
  const site = getSiteUrl();
  const url = `${site}/blog/${input.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: input.headline,
    description: input.description ?? input.headline,
    image: (input.images ?? []).map((i) => absoluteUrl(site, i)),
    author: {
      "@type": "Person",
      name: input.authorName ?? "Magadh Recipe",
    },
    publisher: { "@id": `${site}#organization` },
    ...(input.publishedAt && {
      datePublished: new Date(input.publishedAt).toISOString(),
    }),
    ...(input.updatedAt && {
      dateModified: new Date(input.updatedAt).toISOString(),
    }),
    ...(input.keywords && input.keywords.length > 0 && {
      keywords: input.keywords.join(", "),
    }),
    ...(input.articleSection && { articleSection: input.articleSection }),
    ...(input.wordCount && { wordCount: input.wordCount }),
    inLanguage: "en-IN",
  };
}

// ==================== Recipe ====================

export interface RecipeSchemaInput {
  name: string;
  description?: string;
  slug: string;
  images?: string[];
  authorName?: string;
  publishedAt?: Date | string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  recipeYield?: string;
  recipeCuisine?: string;
  recipeCategory?: string;
  ingredients?: string[];
  instructions?: string[];
  keywords?: string[];
}

function iso8601Duration(minutes?: number): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  return `PT${Math.round(minutes)}M`;
}

export function recipeSchema(input: RecipeSchemaInput) {
  const site = getSiteUrl();
  const url = `${site}/blog/${input.slug}`;
  const prep = iso8601Duration(input.prepTimeMinutes);
  const cook = iso8601Duration(input.cookTimeMinutes);
  const total =
    input.prepTimeMinutes || input.cookTimeMinutes
      ? iso8601Duration((input.prepTimeMinutes ?? 0) + (input.cookTimeMinutes ?? 0))
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    name: input.name,
    description: input.description ?? input.name,
    image: (input.images ?? []).map((i) => absoluteUrl(site, i)),
    author: {
      "@type": "Person",
      name: input.authorName ?? "Magadh Recipe",
    },
    publisher: { "@id": `${site}#organization` },
    ...(input.publishedAt && {
      datePublished: new Date(input.publishedAt).toISOString(),
    }),
    ...(prep && { prepTime: prep }),
    ...(cook && { cookTime: cook }),
    ...(total && { totalTime: total }),
    ...(input.recipeYield && { recipeYield: input.recipeYield }),
    ...(input.recipeCuisine && { recipeCuisine: input.recipeCuisine }),
    ...(input.recipeCategory && { recipeCategory: input.recipeCategory }),
    recipeIngredient: input.ingredients ?? [],
    recipeInstructions: (input.instructions ?? []).map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: step,
    })),
    ...(input.keywords && input.keywords.length > 0 && {
      keywords: input.keywords.join(", "),
    }),
    inLanguage: "en-IN",
  };
}

// ==================== Blog CollectionPage (for /blog index) ====================

export function blogCollectionSchema(
  items: Array<{ title: string; slug: string; publishedAt?: Date | string; excerpt?: string }>
) {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${site}/blog`,
    url: `${site}/blog`,
    name: "Magadh Recipe Journal",
    description:
      "Recipes, stories and guides about Bihari food, pickles and regional specialities.",
    publisher: { "@id": `${site}#organization` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${site}/blog/${p.slug}`,
        name: p.title,
        ...(p.excerpt && { description: p.excerpt }),
        ...(p.publishedAt && {
          datePublished: new Date(p.publishedAt).toISOString(),
        }),
      })),
    },
  };
}

// ==================== Render helper ====================

/**
 * Convenience: render a JSON-LD <script>. Call as `JsonLd({ data })`.
 * Component variant kept in a .tsx file so this stays pure TS.
 */
