import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cat = await prisma.category.findUnique({ where: { id }, select: { name: true } });
  return { title: cat ? `Edit ${cat.name} | Categories` : "Edit Category | Admin" };
}

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) notFound();

  return (
    <CategoryForm
      mode="edit"
      categoryId={cat.id}
      initial={{
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        parentId: cat.parentId,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
      }}
    />
  );
}
