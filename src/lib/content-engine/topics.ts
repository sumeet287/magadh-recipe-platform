/**
 * Magadh Recipe — Content Engine Topic Bank
 *
 * Curated pool of high-potential blog topics targeting the Indian pickle /
 * regional food niche. Each topic carries enough metadata for the LLM to
 * produce ranking-worthy content without manual input.
 *
 * Rotation strategy:
 *   Monday     → cultural / storytelling
 *   Wednesday  → recipe / how-to
 *   Friday     → comparison / health / trends
 *
 * Topics already published (by slug) are automatically skipped.
 */

export type TopicBucket =
  | "cultural"
  | "recipe"
  | "comparison"
  | "health"
  | "trend"
  | "seasonal";

export type TopicSeed = {
  bucket: TopicBucket;
  title: string;
  slug: string;
  angle: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: "informational" | "commercial" | "mixed";
  schemaType: "ARTICLE" | "RECIPE";
  productFocus?: string;
};

export const TOPIC_SEEDS: TopicSeed[] = [
  // ---------------- CULTURAL / STORYTELLING (Monday) ----------------
  {
    bucket: "cultural",
    title: "Bihari Aam Ka Achar: The 200-Year-Old Recipe and Why It Tastes Unlike Any Other Mango Pickle in India",
    slug: "bihari-aam-ka-achar-recipe-history",
    angle: "Origin of Bihari mango pickle in Magadh region, why mustard oil + panch phoran changes the flavour, cultural importance in dals and rotis.",
    primaryKeyword: "bihari aam ka achar",
    secondaryKeywords: ["mango pickle recipe", "traditional aam ka achar", "bihari mango achar", "mustard oil pickle", "homemade mango pickle", "indian mango pickle", "panch phoran pickle"],
    intent: "mixed",
    schemaType: "ARTICLE",
    productFocus: "aam-ka-achar",
  },
  {
    bucket: "cultural",
    title: "The Lost Pickles of Magadh: 7 Forgotten Bihari Achars Your Dadi Still Remembers",
    slug: "forgotten-bihari-pickles-magadh",
    angle: "Deep dive into rare Bihari pickles (kathal, karonda, kamrakh, ol) that urban India has forgotten.",
    primaryKeyword: "forgotten bihari pickles",
    secondaryKeywords: ["rare indian pickles", "bihari achar varieties", "traditional indian pickles list", "regional pickles india", "old pickle recipes"],
    intent: "informational",
    schemaType: "ARTICLE",
  },
  {
    bucket: "cultural",
    title: "Why Every Bihari Kitchen Has a Barni of Achar (And What's Inside It)",
    slug: "bihari-kitchen-achar-tradition",
    angle: "Cultural storytelling: the ceramic jar tradition, summer sun-curing rituals, grandmother recipes passed down generations.",
    primaryKeyword: "bihari pickle tradition",
    secondaryKeywords: ["indian pickle culture", "achar barni", "sun dried pickles india", "grandmother pickle recipe", "traditional pickle making"],
    intent: "informational",
    schemaType: "ARTICLE",
  },
  {
    bucket: "cultural",
    title: "From Nalanda to Your Plate: The Ancient Story of Indian Pickling",
    slug: "history-of-indian-pickles-nalanda",
    angle: "Historical angle tracing pickling to ancient Magadh/Nalanda, Ayurvedic fermentation science, colonial influence.",
    primaryKeyword: "history of indian pickles",
    secondaryKeywords: ["origin of achar", "ancient indian food preservation", "ayurveda fermentation", "indian pickle origin"],
    intent: "informational",
    schemaType: "ARTICLE",
  },
  {
    bucket: "cultural",
    title: "Litti Chokha Without Achar Is Incomplete: The Unwritten Rule of Bihari Cuisine",
    slug: "litti-chokha-achar-pairing",
    angle: "Why Biharis always pair litti chokha with specific pickles, best pickle combinations.",
    primaryKeyword: "litti chokha achar",
    secondaryKeywords: ["bihari food pairing", "litti chokha sides", "bihari cuisine guide", "best achar for litti"],
    intent: "mixed",
    schemaType: "ARTICLE",
  },
  {
    bucket: "cultural",
    title: "Chhath Puja and the Sacred Role of Homemade Pickles in Bihari Households",
    slug: "chhath-puja-pickles-tradition",
    angle: "Connection between Chhath Puja prasad, thekua, and the pickles served. Ritual purity of homemade achar.",
    primaryKeyword: "chhath puja pickles",
    secondaryKeywords: ["bihari festival food", "chhath prasad recipes", "traditional bihari festivals", "homemade pickle chhath"],
    intent: "informational",
    schemaType: "ARTICLE",
  },

  // ---------------- RECIPE / HOW-TO (Wednesday) ----------------
  {
    bucket: "recipe",
    title: "Authentic Bihari Aam Ka Achar Recipe: Step-by-Step with Mustard Oil & Panch Phoran",
    slug: "authentic-bihari-aam-ka-achar-recipe",
    angle: "Full traditional recipe — raw mango selection, sun curing, spice roasting, oil tempering.",
    primaryKeyword: "bihari aam ka achar recipe",
    secondaryKeywords: ["mango pickle recipe indian", "homemade aam ka achar", "traditional mango pickle", "mustard oil mango pickle", "panch phoran achar"],
    intent: "mixed",
    schemaType: "RECIPE",
    productFocus: "aam-ka-achar",
  },
  {
    bucket: "recipe",
    title: "Khatta Meetha Aam Ka Achar Recipe: Sweet and Sour Mango Pickle in 45 Minutes",
    slug: "khatta-meetha-mango-pickle-recipe",
    angle: "Sweet-sour jaggery + spice balance, shortcuts, kid-friendly version.",
    primaryKeyword: "khatta meetha aam ka achar",
    secondaryKeywords: ["sweet and sour mango pickle", "jaggery mango pickle", "khatta meetha achar recipe", "easy mango pickle"],
    intent: "mixed",
    schemaType: "RECIPE",
    productFocus: "khatta-meetha-aam-ka-achar",
  },
  {
    bucket: "recipe",
    title: "Homemade Mirchi Ka Achar: The Bihari Green Chilli Pickle That Wakes Up Any Meal",
    slug: "mirchi-ka-achar-recipe-bihari",
    angle: "Green chilli selection, stuffing technique, shelf life tips.",
    primaryKeyword: "mirchi ka achar recipe",
    secondaryKeywords: ["green chilli pickle", "bihari mirchi achar", "stuffed chilli pickle", "homemade chilli pickle india"],
    intent: "mixed",
    schemaType: "RECIPE",
    productFocus: "mirchi-ka-achar",
  },
  {
    bucket: "recipe",
    title: "Garlic Pickle (Lehsun Ka Achar) Recipe: Bihari-Style Immunity Booster in a Jar",
    slug: "lehsun-ka-achar-garlic-pickle-recipe",
    angle: "Peeling tricks, mustard + vinegar + oil balance, 2-week maturing window.",
    primaryKeyword: "lehsun ka achar recipe",
    secondaryKeywords: ["garlic pickle recipe", "homemade lehsun achar", "garlic pickle indian", "immunity boosting pickle"],
    intent: "mixed",
    schemaType: "RECIPE",
  },
  {
    bucket: "recipe",
    title: "Nimbu Ka Achar: How to Make Sun-Cured Lemon Pickle That Lasts a Year",
    slug: "nimbu-ka-achar-recipe",
    angle: "Sun curing, salt ratios, two variations — spicy and sweet.",
    primaryKeyword: "nimbu ka achar recipe",
    secondaryKeywords: ["lemon pickle recipe", "homemade nimbu achar", "sun cured pickle", "indian lemon pickle"],
    intent: "mixed",
    schemaType: "RECIPE",
  },
  {
    bucket: "recipe",
    title: "Gobhi Gajar Shalgam Achar: The Crunchy Winter Pickle of North India",
    slug: "gobhi-gajar-shalgam-achar-recipe",
    angle: "Winter vegetable pickle, jaggery-vinegar brine, 7-day sun curing.",
    primaryKeyword: "gobhi gajar shalgam achar",
    secondaryKeywords: ["mixed vegetable pickle", "winter pickle recipe", "north indian achar", "punjabi pickle recipe"],
    intent: "mixed",
    schemaType: "RECIPE",
  },

  // ---------------- COMPARISON / BUYING GUIDE (Friday) ----------------
  {
    bucket: "comparison",
    title: "Mustard Oil vs Refined Oil in Pickles: Why Every Traditional Recipe Insists on Sarson",
    slug: "mustard-oil-vs-refined-oil-pickles",
    angle: "Smoke point, preservation chemistry, flavour profile, health claims.",
    primaryKeyword: "mustard oil vs refined oil pickle",
    secondaryKeywords: ["best oil for pickle", "mustard oil benefits pickle", "pickle oil comparison", "kachi ghani mustard oil"],
    intent: "informational",
    schemaType: "ARTICLE",
  },
  {
    bucket: "comparison",
    title: "Store-Bought vs Homemade Pickle: What's Actually Inside Your Favourite Brand?",
    slug: "store-bought-vs-homemade-pickle",
    angle: "Ingredient label breakdown, preservatives, cost per 100g.",
    primaryKeyword: "store bought vs homemade pickle",
    secondaryKeywords: ["best indian pickle brand", "homemade pickle benefits", "pickle preservatives", "healthy pickle choice"],
    intent: "commercial",
    schemaType: "ARTICLE",
  },
  {
    bucket: "comparison",
    title: "Bihari vs Punjabi vs Gujarati Pickles: A Regional Flavour Map of Indian Achar",
    slug: "bihari-vs-punjabi-vs-gujarati-pickles",
    angle: "Spice, oil, sweetness profiles across regions.",
    primaryKeyword: "regional indian pickles compared",
    secondaryKeywords: ["types of indian pickles", "bihari vs punjabi pickle", "gujarati pickle style", "indian pickle regions"],
    intent: "informational",
    schemaType: "ARTICLE",
  },
  {
    bucket: "comparison",
    title: "How to Pick the Right Mango for Pickle: 5 Varieties Every Indian Household Should Know",
    slug: "best-mango-varieties-for-pickle",
    angle: "Ramkela, Totapuri, Rajapuri, Langra raw — sourness and texture guide.",
    primaryKeyword: "best mango for pickle",
    secondaryKeywords: ["raw mango varieties", "pickle mango selection", "ramkela mango pickle", "indian mango types"],
    intent: "informational",
    schemaType: "ARTICLE",
  },

  // ---------------- HEALTH / NUTRITION ----------------
  {
    bucket: "health",
    title: "Is Pickle Good or Bad for Health? The Real Ayurvedic Answer Backed by Science",
    slug: "is-pickle-good-for-health-ayurveda-science",
    angle: "Fermentation probiotics, sodium warning, Ayurvedic digestion claims, daily limit.",
    primaryKeyword: "is pickle good for health",
    secondaryKeywords: ["pickle health benefits", "achar benefits ayurveda", "pickle and digestion", "how much pickle per day", "pickle probiotics"],
    intent: "informational",
    schemaType: "ARTICLE",
  },
  {
    bucket: "health",
    title: "The Gut Health Secret of Indian Pickles: Why Your Grandmother Was Right",
    slug: "indian-pickle-gut-health-benefits",
    angle: "Lacto-fermentation, gut microbiome, comparison with kimchi and sauerkraut.",
    primaryKeyword: "indian pickle gut health",
    secondaryKeywords: ["pickle for gut health", "fermented food india", "pickle probiotics india", "digestion pickle benefits"],
    intent: "informational",
    schemaType: "ARTICLE",
  },
  {
    bucket: "health",
    title: "How Much Pickle Is Safe to Eat Daily? A Dietitian-Style Guide for Indian Families",
    slug: "how-much-pickle-per-day",
    angle: "Sodium limits, spoon-size recommendation, who should avoid.",
    primaryKeyword: "how much pickle per day",
    secondaryKeywords: ["pickle daily intake", "pickle sodium content", "is achar safe daily", "pickle portion size"],
    intent: "informational",
    schemaType: "ARTICLE",
  },

  // ---------------- TREND / LIFESTYLE ----------------
  {
    bucket: "trend",
    title: "15 Unexpected Ways to Use Aam Ka Achar (Beyond Dal Chawal)",
    slug: "creative-ways-to-use-aam-ka-achar",
    angle: "Achar sandwiches, achari pasta, pickle mayo, biryani, grilled cheese.",
    primaryKeyword: "ways to use aam ka achar",
    secondaryKeywords: ["pickle recipes ideas", "cooking with pickle", "achar fusion recipes", "indian pickle hacks"],
    intent: "mixed",
    schemaType: "ARTICLE",
    productFocus: "aam-ka-achar",
  },
  {
    bucket: "trend",
    title: "Why Premium Indian Pickle Brands Are Having a Moment in 2026",
    slug: "premium-indian-pickle-brands-2026",
    angle: "D2C pickle boom, consumer shift from mass to artisanal, export growth.",
    primaryKeyword: "premium indian pickle brands",
    secondaryKeywords: ["best pickle brand india", "artisanal pickle india", "d2c food brands india", "luxury pickle india"],
    intent: "commercial",
    schemaType: "ARTICLE",
  },
  {
    bucket: "trend",
    title: "Pickle Gifting in India: The New Way to Wish Someone a Warm Welcome",
    slug: "pickle-gifting-india-gift-ideas",
    angle: "Corporate and wedding pickle hampers, regional gift etiquette.",
    primaryKeyword: "pickle gifting india",
    secondaryKeywords: ["pickle gift hamper", "indian food gifts", "corporate food gifts", "diwali pickle gifting"],
    intent: "commercial",
    schemaType: "ARTICLE",
  },
  {
    bucket: "trend",
    title: "The NRI's Guide to Buying Authentic Indian Pickles Online (Without Getting Cheated)",
    slug: "nri-guide-buying-indian-pickles-online",
    angle: "Shelf life, shipping, brand red flags, top categories.",
    primaryKeyword: "buy indian pickle online nri",
    secondaryKeywords: ["indian pickle delivery usa", "authentic achar online", "nri indian food", "shipping pickle abroad"],
    intent: "commercial",
    schemaType: "ARTICLE",
  },

  // ---------------- SEASONAL ----------------
  {
    bucket: "seasonal",
    title: "Summer Pickle Calendar: Which Achar to Make in Which Month of Indian Summer",
    slug: "summer-pickle-calendar-india",
    angle: "April-July pickling window, what's in season each month.",
    primaryKeyword: "summer pickle calendar",
    secondaryKeywords: ["when to make pickle", "summer achar india", "seasonal pickle guide", "pickle season india"],
    intent: "informational",
    schemaType: "ARTICLE",
  },
  {
    bucket: "seasonal",
    title: "Monsoon Pickles of India: The Ones Your Dadi Made Only When It Rained",
    slug: "monsoon-pickles-india",
    angle: "Karela, kathal, olive — monsoon-specific pickles and why.",
    primaryKeyword: "monsoon pickles india",
    secondaryKeywords: ["rainy season pickle", "monsoon food india", "seasonal achar", "karela pickle"],
    intent: "informational",
    schemaType: "ARTICLE",
  },
  {
    bucket: "seasonal",
    title: "Winter Pickles of North India: The Crunchy, Spicy Tradition That Warms Every Meal",
    slug: "winter-pickles-north-india",
    angle: "Gobhi, shalgam, gajar, amla — the North Indian winter pantry.",
    primaryKeyword: "winter pickles india",
    secondaryKeywords: ["north indian winter food", "seasonal pickle winter", "amla pickle recipe", "gobhi gajar pickle"],
    intent: "informational",
    schemaType: "ARTICLE",
  },
];

/** Map weekday → preferred bucket (India time). */
export function bucketForWeekday(day: number): TopicBucket {
  // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  if (day === 1 || day === 0) return "cultural";
  if (day === 3 || day === 2) return "recipe";
  if (day === 5 || day === 4 || day === 6) return "comparison";
  return "cultural";
}

export type TopicPickerContext = {
  publishedSlugs: Set<string>;
  weekday?: number;
  bucketOverride?: TopicBucket;
};

/**
 * Choose the next unpublished topic.
 * Preference order:
 *   1. Preferred bucket for the weekday (or override).
 *   2. Any other bucket (to keep variety).
 *   3. If every seed is published, rotate to the oldest published one (returns null).
 */
export function pickNextTopic(ctx: TopicPickerContext): TopicSeed | null {
  const used = ctx.publishedSlugs;
  const targetBucket =
    ctx.bucketOverride ??
    bucketForWeekday(ctx.weekday ?? new Date().getDay());

  const available = TOPIC_SEEDS.filter((t) => !used.has(t.slug));
  if (available.length === 0) return null;

  const preferred = available.filter((t) => t.bucket === targetBucket);
  if (preferred.length > 0) {
    return preferred[Math.floor(Math.random() * preferred.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}
