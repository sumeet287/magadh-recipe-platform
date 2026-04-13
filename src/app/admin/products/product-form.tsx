"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, GripVertical, Image, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useUIStore } from "@/store/ui-store";

interface Variant {
  id?: string;
  name: string;
  sku: string;
  mrp: number;
  price: number;
  stock: number;
  unit: string;
  isDefault: boolean;
  sortOrder: number;
}

interface ProductImage {
  id?: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
}

type SpiceLevel = "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT";
type ProductStatus = "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED" | "ARCHIVED";

export interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  ingredients: string;
  storageInstructions: string;
  shelfLife: string;
  usageSuggestions: string;
  categoryId: string;
  spiceLevel: SpiceLevel;
  region: string;
  isVeg: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  status: ProductStatus;
  tags: string[];
  metaTitle: string;
  metaDesc: string;
  variants: Variant[];
  images: ProductImage[];
}

const EMPTY_VARIANT: Variant = {
  name: "",
  sku: "",
  mrp: 0,
  price: 0,
  stock: 0,
  unit: "g",
  isDefault: false,
  sortOrder: 0,
};

const EMPTY_IMAGE: ProductImage = {
  url: "",
  altText: "",
  isPrimary: false,
  sortOrder: 0,
};

const SPICE_LEVELS: { value: SpiceLevel; label: string }[] = [
  { value: "MILD", label: "Mild" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HOT", label: "Hot" },
  { value: "EXTRA_HOT", label: "Extra Hot" },
];

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
  { value: "DISCONTINUED", label: "Discontinued" },
  { value: "ARCHIVED", label: "Archived" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

const inputClass = "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500";
const textareaClass = "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500";
const labelClass = "block text-sm font-medium text-gray-300 mb-1.5";
const sectionClass = "bg-gray-900 rounded-2xl border border-gray-800 p-6";

export default function ProductForm({ initialData }: { initialData?: ProductFormData }) {
  const router = useRouter();
  const { addToast } = useUIStore();
  const isEdit = !!initialData?.id;

  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [slugManual, setSlugManual] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const [form, setForm] = useState<ProductFormData>(() => initialData ?? {
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    ingredients: "",
    storageInstructions: "",
    shelfLife: "",
    usageSuggestions: "",
    categoryId: "",
    spiceLevel: "MEDIUM",
    region: "Magadh, Bihar",
    isVeg: true,
    isFeatured: false,
    isBestseller: false,
    isNewArrival: false,
    status: "DRAFT",
    tags: [],
    metaTitle: "",
    metaDesc: "",
    variants: [{ ...EMPTY_VARIANT, isDefault: true }],
    images: [],
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((res) => setCategories(res.data ?? []))
      .catch(() => {});
  }, []);

  const updateField = useCallback(
    <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        if (key === "name" && !slugManual) {
          next.slug = slugify(value as string);
        }
        return next;
      });
    },
    [slugManual]
  );

  // --- Variant helpers ---
  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { ...EMPTY_VARIANT, sortOrder: prev.variants.length },
      ],
    }));
  };

  const removeVariant = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx),
    }));
  };

  const updateVariant = (idx: number, field: keyof Variant, value: string | number | boolean) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[idx] = { ...variants[idx], [field]: value };
      if (field === "isDefault" && value === true) {
        variants.forEach((v, i) => {
          if (i !== idx) v.isDefault = false;
        });
      }
      return { ...prev, variants };
    });
  };

  // --- Image helpers ---
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        addToast({ type: "error", message: json.error ?? "Upload failed" });
        return;
      }
      const isPrimary = form.images.length === 0;
      setForm((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          { url: json.data.url, altText: form.name || "", isPrimary, sortOrder: prev.images.length },
        ],
      }));
      addToast({ type: "success", message: "Image uploaded!" });
    } catch {
      addToast({ type: "error", message: "Upload failed. Try again." });
    } finally {
      setUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) uploadFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const addImage = () => {
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { ...EMPTY_IMAGE, sortOrder: prev.images.length },
      ],
    }));
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const updateImage = (idx: number, field: keyof ProductImage, value: string | number | boolean) => {
    setForm((prev) => {
      const images = [...prev.images];
      images[idx] = { ...images[idx], [field]: value };
      if (field === "isPrimary" && value === true) {
        images.forEach((img, i) => {
          if (i !== idx) img.isPrimary = false;
        });
      }
      return { ...prev, images };
    });
  };

  // --- Tags ---
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      updateField("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    updateField("tags", form.tags.filter((t) => t !== tag));
  };

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      addToast({ type: "error", message: "Product name is required" });
      return;
    }
    if (!form.categoryId) {
      addToast({ type: "error", message: "Please select a category" });
      return;
    }
    if (form.variants.length === 0) {
      addToast({ type: "error", message: "At least one variant is required" });
      return;
    }
    for (const v of form.variants) {
      if (!v.sku.trim()) {
        addToast({ type: "error", message: "All variants must have a SKU" });
        return;
      }
    }

    setSaving(true);

    try {
      const url = isEdit
        ? `/api/admin/products/${initialData!.id}`
        : "/api/admin/products";

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast({ type: "error", message: data.error ?? "Something went wrong" });
        return;
      }

      addToast({
        type: "success",
        message: isEdit ? "Product updated successfully" : "Product created successfully",
      });
      router.push("/admin/products");
    } catch {
      addToast({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <button type="button" className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-white">
              {isEdit ? "Edit Product" : "New Product"}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isEdit ? `Editing ${initialData?.name}` : "Create a new product listing"}
            </p>
          </div>
        </div>
        <Button type="submit" loading={saving} className="gap-1.5">
          <Save className="w-4 h-4" /> {isEdit ? "Save Changes" : "Create Product"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <section className={sectionClass}>
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <Input
                label="Product Name"
                labelClassName={labelClass}
                required
                placeholder="e.g. Mango Pickle"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={inputClass}
              />
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass + " !mb-0"}>Slug</label>
                  <button
                    type="button"
                    onClick={() => setSlugManual(!slugManual)}
                    className="text-xs text-brand-400 hover:text-brand-300"
                  >
                    {slugManual ? "Auto-generate" : "Edit manually"}
                  </button>
                </div>
                <Input
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  disabled={!slugManual}
                  placeholder="auto-generated-slug"
                  className={inputClass}
                />
              </div>
              <Input
                label="Short Description"
                labelClassName={labelClass}
                placeholder="Brief product summary"
                value={form.shortDescription}
                onChange={(e) => updateField("shortDescription", e.target.value)}
                className={inputClass}
              />
            </div>
          </section>

          {/* Description */}
          <section className={sectionClass}>
            <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
            <div className="space-y-4">
              <Textarea
                label="Full Description (HTML)"
                labelClassName={labelClass}
                placeholder="<p>Detailed product description...</p>"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={6}
                className={textareaClass}
              />
              <Textarea
                label="Ingredients"
                labelClassName={labelClass}
                placeholder="List of ingredients..."
                value={form.ingredients}
                onChange={(e) => updateField("ingredients", e.target.value)}
                rows={3}
                className={textareaClass}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Shelf Life"
                  labelClassName={labelClass}
                  placeholder="e.g. 12 months"
                  value={form.shelfLife}
                  onChange={(e) => updateField("shelfLife", e.target.value)}
                  className={inputClass}
                />
                <Input
                  label="Region"
                  labelClassName={labelClass}
                  placeholder="e.g. Magadh, Bihar"
                  value={form.region}
                  onChange={(e) => updateField("region", e.target.value)}
                  className={inputClass}
                />
              </div>
              <Textarea
                label="Storage Instructions"
                labelClassName={labelClass}
                placeholder="How to store the product..."
                value={form.storageInstructions}
                onChange={(e) => updateField("storageInstructions", e.target.value)}
                rows={2}
                className={textareaClass}
              />
              <Textarea
                label="Usage Suggestions"
                labelClassName={labelClass}
                placeholder="Serving suggestions, pairings..."
                value={form.usageSuggestions}
                onChange={(e) => updateField("usageSuggestions", e.target.value)}
                rows={2}
                className={textareaClass}
              />
            </div>
          </section>

          {/* Variants */}
          <section className={sectionClass}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Variants</h2>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} className="gap-1.5 border-gray-700 text-gray-300 hover:bg-gray-800">
                <Plus className="w-3.5 h-3.5" /> Add Variant
              </Button>
            </div>

            {form.variants.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No variants added. Add at least one variant.</p>
            )}

            <div className="space-y-4">
              {form.variants.map((variant, idx) => (
                <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-300">Variant {idx + 1}</span>
                      {variant.isDefault && (
                        <span className="text-[10px] bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded">Default</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={variant.isDefault}
                          onChange={(e) => updateVariant(idx, "isDefault", e.target.checked)}
                          className="rounded border-gray-600 bg-gray-700 text-brand-500 focus:ring-brand-500/30"
                        />
                        Default
                      </label>
                      {form.variants.length > 1 && (
                        <button type="button" onClick={() => removeVariant(idx)} className="text-gray-500 hover:text-red-400 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Input
                      placeholder="Name (e.g. 250g)"
                      value={variant.name}
                      onChange={(e) => updateVariant(idx, "name", e.target.value)}
                      className={inputClass + " h-9 text-sm"}
                    />
                    <Input
                      placeholder="SKU"
                      required
                      value={variant.sku}
                      onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                      className={inputClass + " h-9 text-sm"}
                    />
                    <Input
                      placeholder="MRP"
                      type="number"
                      min={0}
                      step="0.01"
                      value={variant.mrp || ""}
                      onChange={(e) => updateVariant(idx, "mrp", parseFloat(e.target.value) || 0)}
                      className={inputClass + " h-9 text-sm"}
                    />
                    <Input
                      placeholder="Selling Price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={variant.price || ""}
                      onChange={(e) => updateVariant(idx, "price", parseFloat(e.target.value) || 0)}
                      className={inputClass + " h-9 text-sm"}
                    />
                    <Input
                      placeholder="Stock"
                      type="number"
                      min={0}
                      value={variant.stock || ""}
                      onChange={(e) => updateVariant(idx, "stock", parseInt(e.target.value) || 0)}
                      className={inputClass + " h-9 text-sm"}
                    />
                    <Input
                      placeholder="Unit (g, ml)"
                      value={variant.unit}
                      onChange={(e) => updateVariant(idx, "unit", e.target.value)}
                      className={inputClass + " h-9 text-sm"}
                    />
                    <Input
                      placeholder="Sort Order"
                      type="number"
                      min={0}
                      value={variant.sortOrder}
                      onChange={(e) => updateVariant(idx, "sortOrder", parseInt(e.target.value) || 0)}
                      className={inputClass + " h-9 text-sm"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Images */}
          <section className={sectionClass}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Images</h2>
              <Button type="button" variant="outline" size="sm" onClick={addImage} className="gap-1.5 border-gray-700 text-gray-300 hover:bg-gray-800">
                <Image className="w-3.5 h-3.5" /> Add URL
              </Button>
            </div>

            {/* Upload zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-gray-700 hover:border-brand-500/50 rounded-xl p-6 text-center transition-colors mb-4 cursor-pointer"
              onClick={() => document.getElementById("img-upload")?.click()}
            >
              <input id="img-upload" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-brand-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Drag & drop image here or click to browse</p>
                  <p className="text-xs text-gray-600 mt-1">Max 5MB. JPG, PNG, WebP supported.</p>
                </>
              )}
            </div>

            {/* Image list */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden group">
                    {img.url ? (
                      <img src={img.url} alt={img.altText} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center bg-gray-800">
                        <Image className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer bg-white/10 px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={img.isPrimary}
                          onChange={(e) => updateImage(idx, "isPrimary", e.target.checked)}
                          className="rounded border-gray-600 bg-gray-700 text-brand-500 w-3 h-3"
                        />
                        Primary
                      </label>
                      <button type="button" onClick={() => removeImage(idx)} className="text-red-400 hover:text-red-300 bg-white/10 px-2 py-1 rounded text-xs flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                    {img.isPrimary && (
                      <div className="absolute top-2 left-2 text-[9px] bg-green-500/90 text-white px-1.5 py-0.5 rounded font-bold">PRIMARY</div>
                    )}
                    {!img.url && (
                      <div className="p-2">
                        <Input
                          placeholder="Paste image URL..."
                          value={img.url}
                          onChange={(e) => updateImage(idx, "url", e.target.value)}
                          className={inputClass + " h-8 text-xs"}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SEO */}
          <section className={sectionClass}>
            <h2 className="text-lg font-semibold text-white mb-4">SEO</h2>
            <div className="space-y-4">
              <Input
                label="Meta Title"
                labelClassName={labelClass}
                placeholder="Page title for search engines"
                value={form.metaTitle}
                onChange={(e) => updateField("metaTitle", e.target.value)}
                className={inputClass}
              />
              <Textarea
                label="Meta Description"
                labelClassName={labelClass}
                placeholder="Brief description for search results..."
                value={form.metaDesc}
                onChange={(e) => updateField("metaDesc", e.target.value)}
                rows={3}
                className={textareaClass}
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <section className={sectionClass}>
            <h2 className="text-lg font-semibold text-white mb-4">Status</h2>
            <div>
              <label className={labelClass}>Product Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value as ProductStatus)}
                className="w-full h-11 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Category & Spice Level */}
          <section className={sectionClass}>
            <h2 className="text-lg font-semibold text-white mb-4">Category &amp; Tags</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Category <span className="text-spice-500">*</span>
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => updateField("categoryId", e.target.value)}
                  required
                  className="w-full h-11 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Spice Level</label>
                <select
                  value={form.spiceLevel}
                  onChange={(e) => updateField("spiceLevel", e.target.value as SpiceLevel)}
                  className="w-full h-11 rounded-lg border border-gray-700 bg-gray-800 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  {SPICE_LEVELS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Tags</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className={inputClass + " flex-1"}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag} className="border-gray-700 text-gray-300 hover:bg-gray-800 h-11 px-3">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-lg border border-gray-700">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-gray-500 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Flags */}
          <section className={sectionClass}>
            <h2 className="text-lg font-semibold text-white mb-4">Flags</h2>
            <div className="space-y-3">
              {([
                ["isVeg", "Vegetarian"],
                ["isFeatured", "Featured"],
                ["isBestseller", "Bestseller"],
                ["isNewArrival", "New Arrival"],
              ] as [keyof ProductFormData, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={form[key] as boolean}
                      onChange={(e) => updateField(key, e.target.checked as never)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 rounded-full peer-checked:bg-brand-500 transition-colors" />
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
