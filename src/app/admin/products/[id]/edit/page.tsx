import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProductForm, { type ProductFormData } from "../../product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/login?callbackUrl=/admin");
  }

  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!product) {
    redirect("/admin/products");
  }

  const initialData: ProductFormData = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    ingredients: product.ingredients ?? "",
    storageInstructions: product.storageInstructions ?? "",
    shelfLife: product.shelfLife ?? "",
    usageSuggestions: product.usageSuggestions ?? "",
    categoryId: product.categoryId,
    spiceLevel: product.spiceLevel as ProductFormData["spiceLevel"],
    region: product.region ?? "Magadh, Bihar",
    isVeg: product.isVeg,
    isFeatured: product.isFeatured,
    isBestseller: product.isBestseller,
    isNewArrival: product.isNewArrival,
    status: product.status as ProductFormData["status"],
    tags: product.tags,
    metaTitle: product.metaTitle ?? "",
    metaDesc: product.metaDesc ?? "",
    variants: product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      mrp: Number(v.mrp),
      price: Number(v.price),
      stock: v.stock,
      unit: v.unit ?? "g",
      isDefault: v.isDefault,
      sortOrder: v.sortOrder,
    })),
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText ?? "",
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
  };

  return <ProductForm initialData={initialData} />;
}
