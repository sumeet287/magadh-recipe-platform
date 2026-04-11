import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FolderOpen, Plus, Pencil, Package } from "lucide-react";

export const metadata = { title: "Categories | Magadh Recipe Admin" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Categories</h1>
          <p className="text-gray-400 text-sm mt-1">{categories.length} total categories</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Slug</th>
              <th className="px-6 py-3 font-medium">Products</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Sort Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                        <FolderOpen className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{cat.name}</p>
                      {cat.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{cat.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400 font-mono text-xs">{cat.slug}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-gray-300">
                    <Package className="w-3.5 h-3.5" />
                    {cat._count.products}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.isActive ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                    {cat.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400">{cat.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
