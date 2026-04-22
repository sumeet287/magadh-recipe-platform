"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/ui-store";
import { slugify } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  postCount: number;
};

export function BlogCategoryManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const router = useRouter();
  const { addToast } = useUIStore();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: (slug.trim() || slugify(name)).toLowerCase(),
          description: description.trim() || null,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        addToast({ type: "error", message: json.error ?? "Failed to create" });
        return;
      }
      addToast({ type: "success", message: "Category created" });
      setName("");
      setSlug("");
      setDescription("");
      router.refresh();
    } catch {
      addToast({ type: "error", message: "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  const fieldCls = "bg-gray-950 border-gray-700 text-white";

  return (
    <div className="space-y-5">
      <form
        onSubmit={create}
        className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-3"
      >
        <h2 className="text-sm font-semibold text-white">Add new category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldCls}
            placeholder="Name (e.g. Recipes)"
            maxLength={120}
            required
          />
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={`${fieldCls} font-mono text-xs`}
            placeholder="slug (auto)"
            maxLength={120}
          />
        </div>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={fieldCls}
          placeholder="Short description (optional)"
          maxLength={1000}
        />
        <Button
          type="submit"
          disabled={saving || !name.trim()}
          className="bg-brand-600 hover:bg-brand-500"
        >
          <Plus className="w-4 h-4" />
          {saving ? "Adding…" : "Add category"}
        </Button>
      </form>

      {initialCategories.length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Posts</th>
                <th className="px-5 py-3 font-medium">Sort</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {initialCategories.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3">
                    <p className="text-white font-medium">{c.name}</p>
                    {c.description && (
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">
                        {c.description}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                    {c.slug}
                  </td>
                  <td className="px-5 py-3 text-gray-300">{c.postCount}</td>
                  <td className="px-5 py-3 text-gray-400">{c.sortOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
