"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/ui-store";
import { slugify } from "@/lib/utils";

type CategoryOption = { id: string; name: string; slug: string; parentId: string | null };

type Initial = {
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function CategoryForm({
  mode,
  categoryId,
  initial,
}: {
  mode: "create" | "edit";
  categoryId?: string;
  initial?: Initial;
}) {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [parents, setParents] = useState<CategoryOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugDirty, setSlugDirty] = useState(mode === "edit");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [parentId, setParentId] = useState(initial?.parentId ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  useEffect(() => {
    if (mode === "create" && !slugDirty) {
      setSlug(slugify(name));
    }
  }, [name, mode, slugDirty]);

  const loadParents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const list = json.data as CategoryOption[];
        setParents(list.filter((c) => mode === "create" || c.id !== categoryId));
      }
    } catch {
      addToast({ type: "error", message: "Failed to load categories" });
    }
  }, [addToast, categoryId, mode]);

  useEffect(() => {
    loadParents();
  }, [loadParents]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        image: image.trim() || null,
        parentId: parentId || null,
        sortOrder: Number.parseInt(sortOrder, 10) || 0,
        isActive,
      };

      const url =
        mode === "create"
          ? "/api/admin/categories"
          : `/api/admin/categories/${categoryId}`;
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
        message: mode === "create" ? "Category created" : "Category updated",
      });
      router.push("/admin/categories");
      router.refresh();
    } catch {
      addToast({ type: "error", message: "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/categories"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif text-2xl font-bold text-white">
          {mode === "create" ? "New category" : "Edit category"}
        </h1>
      </div>

      <form onSubmit={submit} className="space-y-5 bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-950 border-gray-700 text-white"
            required
            maxLength={120}
            placeholder="e.g. Amla Pickle"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Slug</label>
          <Input
            value={slug}
            onChange={(e) => {
              setSlugDirty(true);
              setSlug(e.target.value);
            }}
            className="bg-gray-950 border-gray-700 text-white font-mono text-sm"
            maxLength={120}
            placeholder="auto from name"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            URL segment: /products?category=<span className="text-gray-400">{slug || "…"}</span>
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[100px] rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            maxLength={5000}
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Image URL</label>
          <Input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="bg-gray-950 border-gray-700 text-white"
            placeholder="https://… or /path"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Parent category</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">None (top level)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.slug})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Sort order</label>
            <Input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-gray-950 border-gray-700 text-white"
            />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-600"
              />
              Active
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-500">
            {saving ? "Saving…" : mode === "create" ? "Create category" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" className="border-gray-600 text-gray-300" asChild>
            <Link href="/admin/categories">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
