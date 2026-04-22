/**
 * LLM-backed blog generator for Magadh Recipe.
 *
 * Supports two providers — default is Gemini (free tier is enough for our
 * 3-blogs-per-week cadence). OpenAI is kept as a drop-in alternative.
 *
 * Env:
 *   CONTENT_ENGINE_PROVIDER   "gemini" (default) | "openai"
 *
 *   # Gemini (free tier: https://aistudio.google.com/apikey)
 *   GEMINI_API_KEY            required when provider = gemini
 *   GEMINI_MODEL              optional, default "gemini-2.0-flash"
 *
 *   # OpenAI (paid)
 *   OPENAI_API_KEY            required when provider = openai
 *   OPENAI_MODEL              optional, default "gpt-4o"
 */

import { z } from "zod";
import type { TopicSeed } from "./topics";

export const blogPayloadSchema = z.object({
  title: z.string().min(20).max(180),
  metaTitle: z.string().min(20).max(70),
  metaDesc: z.string().min(100).max(180),
  slug: z.string().min(5).max(120),
  excerpt: z.string().min(80).max(320),
  subtitle: z.string().min(15).max(200),
  coverImageAlt: z.string().min(15).max(180),
  readTimeMinutes: z.number().int().min(3).max(25),
  tags: z.array(z.string().min(2).max(40)).min(3).max(12),
  metaKeywords: z.string().min(10).max(400),
  content: z.string().min(3500),
  faqs: z
    .array(
      z.object({
        question: z.string().min(8).max(200),
        answer: z.string().min(25).max(1200),
      }),
    )
    .min(4)
    .max(8),
  recipe: z
    .object({
      yield: z.string().min(2).max(80).optional(),
      prepTimeMinutes: z.number().int().min(1).max(720).optional(),
      cookTimeMinutes: z.number().int().min(0).max(720).optional(),
      cuisine: z.string().min(2).max(60).optional(),
      categoryName: z.string().min(2).max(60).optional(),
      ingredients: z.array(z.string().min(2).max(240)).optional(),
      instructions: z.array(z.string().min(10).max(1200)).optional(),
    })
    .optional()
    .nullable(),
});

export type BlogPayload = z.infer<typeof blogPayloadSchema>;

const SYSTEM_PROMPT = `You are the head content strategist and food writer for Magadh Recipe — a premium Indian pickle brand rooted in Bihar's Magadh region.

Your job is to write blog posts that:
- Rank on Google for real search queries
- Read like a human food writer, NOT like AI
- Subtly build trust in Magadh Recipe's handcrafted, traditional, small-batch pickles
- Carry cultural depth (Bihar, Magadh, ancient India) without sounding like a textbook

HARD RULES:
1. Write in a warm, slightly premium, conversational Indian-English tone. Light Hindi words (achar, barni, sarson, dadi, panch phoran) are welcome and add authenticity — never italicise them.
2. Word count: 1300–1700 words of real prose (NOT counting HTML tags).
3. Structure: engaging hook paragraph → 5–7 H2 sections → short H3 sub-sections where useful → conclusion with soft CTA.
4. Integrate Magadh Recipe ONCE, naturally, in the second half only — never in the intro, never more than twice.
5. If a productFocus slug is supplied, link to /products/<slug> once using an <a> tag with natural anchor text.
6. Include at least TWO suggested internal links (use /blog/ paths — they may be future posts) and one external authoritative link (e.g. FSSAI, a respected health site, or a cultural reference) inside the content.
7. Include 4–8 genuinely useful FAQs that answer real long-tail searches.
8. Return content as clean semantic HTML using only these tags: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>, <a>. No <html>, <body>, <head>, <img>, <style>, <script>.
9. Zero fluff, zero "In this article, we will explore…", zero "In conclusion". Open with a scene, smell, memory, or surprising fact.
10. For RECIPE posts, include a recipe object with yield, prep/cook time, cuisine (usually "Bihari" or "Indian"), ingredients (as array), and instructions (as array of clear steps).

OUTPUT: Valid JSON matching the provided schema. No prose outside JSON, no markdown code fences.`;

function buildUserPrompt(topic: TopicSeed): string {
  const today = new Date().toISOString().split("T")[0];
  return `Write the next Magadh Recipe blog. Use this brief as the foundation and make it feel handcrafted.

TODAY: ${today}
TOPIC TITLE (feel free to improve for CTR, keep intent): ${topic.title}
ANGLE: ${topic.angle}
PRIMARY KEYWORD: ${topic.primaryKeyword}
SECONDARY KEYWORDS: ${topic.secondaryKeywords.join(", ")}
SEARCH INTENT: ${topic.intent}
SCHEMA TYPE: ${topic.schemaType}
PRODUCT FOCUS SLUG (optional, may be empty): ${topic.productFocus ?? ""}
PREFERRED SLUG (use unless you have a strongly better one): ${topic.slug}

Specific requirements for this post:
- Place the primary keyword in the H1 (title), in the first 100 words, in at least two H2s, and naturally 6–10 times throughout.
- Place secondary keywords at least once each where natural.
- Include 1 featured-snippet-ready paragraph (40–55 words, starts with a clear definition).
- Include 1 numbered list (good for "How to" snippets).
- Include a "quick answer" <blockquote> near the top for the primary question.
- metaTitle ≤ 60 chars, metaDesc 140–160 chars, both include the primary keyword.
- coverImageAlt must include the primary keyword and describe a realistic photo.
- Tags: 5–8 lowercase keyword-style tags.
- FAQs must be genuinely different long-tail queries, NOT rephrasings of the title.
${topic.productFocus ? `- Link the product once: <a href="/products/${topic.productFocus}">relevant anchor text</a>.` : ""}
${topic.schemaType === "RECIPE" ? "- REQUIRED: populate the recipe object with real, authentic Bihari ingredients and numbered instructions." : "- The recipe object should be null."}

Return the JSON now.`;
}

/* ------------------------------------------------------------------ */
/* Shared JSON Schema (used by both providers)                         */
/* ------------------------------------------------------------------ */

const SHARED_SCHEMA = {
  type: "object",
  required: [
    "title",
    "metaTitle",
    "metaDesc",
    "slug",
    "excerpt",
    "subtitle",
    "coverImageAlt",
    "readTimeMinutes",
    "tags",
    "metaKeywords",
    "content",
    "faqs",
  ],
  properties: {
    title: { type: "string" },
    metaTitle: { type: "string" },
    metaDesc: { type: "string" },
    slug: { type: "string" },
    excerpt: { type: "string" },
    subtitle: { type: "string" },
    coverImageAlt: { type: "string" },
    readTimeMinutes: { type: "integer" },
    tags: { type: "array", items: { type: "string" } },
    metaKeywords: { type: "string" },
    content: { type: "string" },
    faqs: {
      type: "array",
      items: {
        type: "object",
        required: ["question", "answer"],
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
      },
    },
    recipe: {
      type: "object",
      properties: {
        yield: { type: "string" },
        prepTimeMinutes: { type: "integer" },
        cookTimeMinutes: { type: "integer" },
        cuisine: { type: "string" },
        categoryName: { type: "string" },
        ingredients: { type: "array", items: { type: "string" } },
        instructions: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;

/* ------------------------------------------------------------------ */
/* GEMINI (default, free tier)                                         */
/* ------------------------------------------------------------------ */

async function generateWithGemini(topic: TopicSeed): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey",
    );
  }
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(topic) }] }],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: SHARED_SCHEMA,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 600)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };

  const blocked = json.promptFeedback?.blockReason;
  if (blocked) throw new Error(`Gemini blocked the prompt: ${blocked}`);

  const text = json.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

/* ------------------------------------------------------------------ */
/* OPENAI (optional paid fallback)                                     */
/* ------------------------------------------------------------------ */

async function generateWithOpenAI(topic: TopicSeed): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.75,
      max_tokens: 6500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(topic) },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI API ${res.status}: ${errText.slice(0, 500)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned empty content");
  return raw;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

function stripJsonFences(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
  }
  return s;
}

export function activeProvider(): "gemini" | "openai" {
  const raw = (process.env.CONTENT_ENGINE_PROVIDER || "gemini").toLowerCase();
  return raw === "openai" ? "openai" : "gemini";
}

export async function generateBlogPayload(topic: TopicSeed): Promise<BlogPayload> {
  const provider = activeProvider();
  const rawText =
    provider === "openai"
      ? await generateWithOpenAI(topic)
      : await generateWithGemini(topic);

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFences(rawText));
  } catch {
    throw new Error(`${provider} returned invalid JSON`);
  }

  const validated = blogPayloadSchema.safeParse(parsed);
  if (!validated.success) {
    const first = validated.error.errors[0];
    throw new Error(
      `Generated payload failed validation: ${first?.path.join(".")} — ${first?.message}`,
    );
  }
  return validated.data;
}
