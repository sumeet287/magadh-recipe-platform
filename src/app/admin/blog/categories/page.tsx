import Link from "next/link";
import { ArrowLeft, FolderOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BlogCategoryManager } from "@/components/admin/blog-category-manager";

export const metadata = { title: "Blog Categories | Magadh Recipe Admin" };

export default async function BlogCategoriesPage() {
  const categories = await prisma.blogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { posts: true } } },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/blog"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Blog categories</h1>
          <p className="text-gray-400 text-sm mt-1">
            {categories.length} categories · used to group and filter articles
          </p>
        </div>
      </div>

      <BlogCategoryManager
        initialCategories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
          postCount: c._count.posts,
        }))}
      />

      {categories.length === 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-10 text-center">
          <FolderOpen className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            No categories yet — add your first one above.
          </p>
        </div>
      )}
    </div>
  );
}
