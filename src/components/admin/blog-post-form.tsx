"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/ui-store";
import { slugify } from "@/lib/utils";

type SchemaType = "ARTICLE" | "RECIPE" | "HOWTO";
type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type CategoryOption = { id: string; name: string; slug: string };

type FaqItem = { question: string; answer: string };

export type BlogInitial = {
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  coverImageAlt: string | null;
  categoryId: string | null;
  tags: string[];
  readTimeMinutes: number | null;
  authorName: string | null;
  status: Status;
  publishedAt: Date | null;
  metaTitle: string | null;
  metaDesc: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  schemaType: SchemaType;
  recipeYield: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  recipeCuisine: string | null;
  recipeCategoryName: string | null;
  recipeIngredients: string[];
  recipeInstructions: string[];
  faqs: FaqItem[] | null;
};

interface Props {
  mode: "create" | "edit";
  postId?: string;
  initial?: BlogInitial;
}

function toArrayText(arr: string[] | null | undefined): string {
  return (arr ?? []).join("\n");
}
function toTextArray(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function BlogPostForm({ mode, postId, initial }: Props) {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(mode === "edit");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(initial?.coverImageAlt ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [readTimeMinutes, setReadTimeMinutes] = useState(
    initial?.readTimeMinutes ? String(initial.readTimeMinutes) : ""
  );
  const [authorName, setAuthorName] = useState(initial?.authorName ?? "Magadh Recipe");
  const [status, setStatus] = useState<Status>(initial?.status ?? "DRAFT");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDesc, setMetaDesc] = useState(initial?.metaDesc ?? "");
  const [metaKeywords, setMetaKeywords] = useState(initial?.metaKeywords ?? "");
  const [ogImage, setOgImage] = useState(initial?.ogImage ?? "");
  const [schemaType, setSchemaType] = useState<SchemaType>(
    initial?.schemaType ?? "ARTICLE"
  );
  const [recipeYield, setRecipeYield] = useState(initial?.recipeYield ?? "");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    initial?.prepTimeMinutes ? String(initial.prepTimeMinutes) : ""
  );
  const [cookTimeMinutes, setCookTimeMinutes] = useState(
    initial?.cookTimeMinutes ? String(initial.cookTimeMinutes) : ""
  );
  const [recipeCuisine, setRecipeCuisine] = useState(initial?.recipeCuisine ?? "Bihari");
  const [recipeCategoryName, setRecipeCategoryName] = useState(
    initial?.recipeCategoryName ?? ""
  );
  const [ingredientsText, setIngredientsText] = useState(
    toArrayText(initial?.recipeIngredients)
  );
  const [instructionsText, setInstructionsText] = useState(
    toArrayText(initial?.recipeInstructions)
  );
  const [faqs, setFaqs] = useState<FaqItem[]>(initial?.faqs ?? []);

  useEffect(() => {
    if (mode === "create" && !slugDirty) {
      setSlug(slugify(title));
    }
  }, [title, mode, slugDirty]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/blog/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCategories(
          (json.data as CategoryOption[]).map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))
        );
      }
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const tags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    [tagsText]
  );

  const addFaq = () =>
    setFaqs((f) => [...f, { question: "", answer: "" }]);
  const removeFaq = (i: number) =>
    setFaqs((f) => f.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        slug: slug.trim(),
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        excerpt: excerpt.trim() || null,
        content,
        coverImage: coverImage.trim() || null,
        coverImageAlt: coverImageAlt.trim() || null,
        categoryId: categoryId || null,
        tags,
        readTimeMinutes: readTimeMinutes
          ? Number.parseInt(readTimeMinutes, 10)
          : null,
        authorName: authorName.trim() || null,
        status,
        metaTitle: metaTitle.trim() || null,
        metaDesc: metaDesc.trim() || null,
        metaKeywords: metaKeywords.trim() || null,
        ogImage: ogImage.trim() || null,
        schemaType,
        recipeYield: recipeYield.trim() || null,
        prepTimeMinutes: prepTimeMinutes
          ? Number.parseInt(prepTimeMinutes, 10)
          : null,
        cookTimeMinutes: cookTimeMinutes
          ? Number.parseInt(cookTimeMinutes, 10)
          : null,
        recipeCuisine: recipeCuisine.trim() || null,
        recipeCategoryName: recipeCategoryName.trim() || null,
        recipeIngredients: toTextArray(ingredientsText),
        recipeInstructions: toTextArray(instructionsText),
        faqs: faqs
          .map((f) => ({
            question: f.question.trim(),
            answer: f.answer.trim(),
          }))
          .filter((f) => f.question && f.answer),
      };

      const url =
        mode === "create" ? "/api/admin/blog" : `/api/admin/blog/${postId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        addToast({ type: "error", message: json.error ?? "Save failed" });
        return;
      }
      addToast({
        type: "success",
        message: mode === "create" ? "Post created" : "Post updated",
      });
      router.push("/admin/blog");
      router.refresh();
    } catch {
      addToast({ type: "error", message: "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!postId) return;
    if (!confirm("Delete this post permanently? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
    const json = await res.json();
    if (!json.success) {
      addToast({ type: "error", message: json.error ?? "Delete failed" });
      return;
    }
    addToast({ type: "success", message: "Post deleted" });
    router.push("/admin/blog");
    router.refresh();
  };

  const labelCls = "block text-xs font-medium text-gray-400 mb-1.5";
  const panelCls = "bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4";
  const fieldCls = "bg-gray-950 border-gray-700 text-white";
  const textareaCls =
    "w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

  return (
    <form onSubmit={submit} className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-serif text-2xl font-bold text-white">
            {mode === "create" ? "New post" : "Edit post"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {mode === "edit" && (
            <Button
              type="button"
              variant="outline"
              onClick={onDelete}
              className="border-red-900/60 text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            asChild
            className="border-gray-600 text-gray-300"
          >
            <Link href="/admin/blog">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-500"
          >
            {saving
              ? "Saving…"
              : mode === "create"
                ? status === "PUBLISHED"
                  ? "Publish"
                  : "Save draft"
                : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Core content */}
          <section className={panelCls}>
            <div>
              <label className={labelCls}>Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={fieldCls}
                required
                maxLength={240}
                placeholder="Why Bihari pickle is unlike any other"
              />
            </div>
            <div>
              <label className={labelCls}>Slug</label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugDirty(true);
                  setSlug(e.target.value);
                }}
                className={`${fieldCls} font-mono text-sm`}
                placeholder="auto from title"
                maxLength={200}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                /blog/<span className="text-gray-400">{slug || "…"}</span>
              </p>
            </div>
            <div>
              <label className={labelCls}>Subtitle</label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className={fieldCls}
                maxLength={240}
                placeholder="Optional deck / dek"
              />
            </div>
            <div>
              <label className={labelCls}>Excerpt</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className={`${textareaCls} min-h-[80px]`}
                maxLength={600}
                placeholder="Short teaser shown on listings and social shares"
              />
            </div>
            <div>
              <label className={labelCls}>Content (HTML) *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`${textareaCls} min-h-[380px] font-mono text-xs leading-relaxed`}
                placeholder="<p>Your article HTML…</p>"
                required
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Accepts raw HTML. Use h2/h3/p/ul/ol/blockquote/img/a. Styling is applied
                automatically via the .blog-prose class.
              </p>
            </div>
          </section>

          {/* Recipe panel */}
          {schemaType === "RECIPE" && (
            <section className={panelCls}>
              <h2 className="text-sm font-semibold text-white">Recipe details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Prep time (min)</label>
                  <Input
                    type="number"
                    min={0}
                    value={prepTimeMinutes}
                    onChange={(e) => setPrepTimeMinutes(e.target.value)}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Cook time (min)</label>
                  <Input
                    type="number"
                    min={0}
                    value={cookTimeMinutes}
                    onChange={(e) => setCookTimeMinutes(e.target.value)}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Yield / serves</label>
                  <Input
                    value={recipeYield}
                    onChange={(e) => setRecipeYield(e.target.value)}
                    className={fieldCls}
                    placeholder="e.g. 4 servings"
                  />
                </div>
                <div>
                  <label className={labelCls}>Cuisine</label>
                  <Input
                    value={recipeCuisine}
                    onChange={(e) => setRecipeCuisine(e.target.value)}
                    className={fieldCls}
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Recipe category</label>
                  <Input
                    value={recipeCategoryName}
                    onChange={(e) => setRecipeCategoryName(e.target.value)}
                    className={fieldCls}
                    placeholder="e.g. Pickle, Main course, Side dish"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Ingredients (one per line)</label>
                <textarea
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  className={`${textareaCls} min-h-[140px]`}
                  placeholder={"250 g raw mango\n2 tbsp mustard oil\n1 tsp fenugreek seeds"}
                />
              </div>
              <div>
                <label className={labelCls}>Method (one step per line)</label>
                <textarea
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  className={`${textareaCls} min-h-[160px]`}
                  placeholder={"Wash and dry raw mangoes…\nHeat mustard oil until it smokes…"}
                />
              </div>
            </section>
          )}

          {/* FAQs */}
          <section className={panelCls}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">FAQs (optional)</h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addFaq}
                className="border-gray-700 text-gray-300"
              >
                <Plus className="w-3.5 h-3.5" />
                Add FAQ
              </Button>
            </div>
            {faqs.length === 0 && (
              <p className="text-xs text-gray-500">
                FAQs add schema markup and improve visibility in AI answer engines.
              </p>
            )}
            {faqs.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-800 p-4 bg-gray-950/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">FAQ #{i + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeFaq(i)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
                <Input
                  value={f.question}
                  onChange={(e) =>
                    setFaqs((arr) =>
                      arr.map((x, idx) =>
                        idx === i ? { ...x, question: e.target.value } : x
                      )
                    )
                  }
                  className={fieldCls}
                  placeholder="Question"
                  maxLength={300}
                />
                <textarea
                  value={f.answer}
                  onChange={(e) =>
                    setFaqs((arr) =>
                      arr.map((x, idx) =>
                        idx === i ? { ...x, answer: e.target.value } : x
                      )
                    )
                  }
                  className={`${textareaCls} min-h-[80px]`}
                  placeholder="Answer"
                  maxLength={4000}
                />
              </div>
            ))}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className={panelCls}>
            <h2 className="text-sm font-semibold text-white">Publish</h2>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className={`${textareaCls}`}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select
                value={schemaType}
                onChange={(e) => setSchemaType(e.target.value as SchemaType)}
                className={`${textareaCls}`}
              >
                <option value="ARTICLE">Article</option>
                <option value="RECIPE">Recipe</option>
                <option value="HOWTO">How-to guide</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={`${textareaCls}`}
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Author</label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className={fieldCls}
                maxLength={120}
              />
            </div>
            <div>
              <label className={labelCls}>Read time (min)</label>
              <Input
                type="number"
                min={1}
                value={readTimeMinutes}
                onChange={(e) => setReadTimeMinutes(e.target.value)}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tags (comma separated)</label>
              <Input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className={fieldCls}
                placeholder="pickle, bihari, recipe"
              />
            </div>
          </section>

          <section className={panelCls}>
            <h2 className="text-sm font-semibold text-white">Cover image</h2>
            <div>
              <label className={labelCls}>Image URL</label>
              <Input
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className={fieldCls}
                placeholder="https://…"
              />
            </div>
            <div>
              <label className={labelCls}>Alt text</label>
              <Input
                value={coverImageAlt}
                onChange={(e) => setCoverImageAlt(e.target.value)}
                className={fieldCls}
                maxLength={240}
                placeholder="Describe the cover image"
              />
            </div>
          </section>

          <section className={panelCls}>
            <h2 className="text-sm font-semibold text-white">SEO</h2>
            <div>
              <label className={labelCls}>Meta title</label>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className={fieldCls}
                maxLength={240}
                placeholder="Defaults to post title"
              />
            </div>
            <div>
              <label className={labelCls}>Meta description</label>
              <textarea
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                className={`${textareaCls} min-h-[70px]`}
                maxLength={320}
                placeholder="Search result snippet"
              />
            </div>
            <div>
              <label className={labelCls}>Meta keywords</label>
              <Input
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                className={fieldCls}
                maxLength={480}
                placeholder="bihari pickle, aam achar, recipe"
              />
            </div>
            <div>
              <label className={labelCls}>OG image URL</label>
              <Input
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                className={fieldCls}
                placeholder="Falls back to cover image"
              />
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
