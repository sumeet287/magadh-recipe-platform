"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

interface Product {
  id: string;
  name: string;
  slug: string;
  status: string;
  isBestseller: boolean;
  isNewArrival: boolean;
  category: { name: string };
  variants: Array<{ price: number; mrp: number; stock: number }>;
  images: Array<{ url: string }>;
  _count: { reviews: number };
}

export default function AdminProductsPage() {
  const { addToast } = useUIStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/products?${params}`);
    const data = await res.json();
    setProducts(data.data ?? []);
    setTotal(data.meta?.total ?? 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/products/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    if (res.ok) {
      addToast({ type: "success", message: "Product archived successfully" });
      fetchProducts();
    } else {
      addToast({ type: "error", message: "Failed to archive product" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-gray-400 mt-1">{total} total products</p>
        </div>
        <Link href="/admin/products/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Input
        placeholder="Search products..."
        leftIcon={<Search className="w-4 h-4 text-gray-400" />}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="max-w-sm bg-gray-900 border-gray-700 text-white"
      />

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs">
                <th className="text-left px-5 py-3 font-medium">Product</th>
                <th className="text-left px-5 py-3 font-medium">Category</th>
                <th className="text-left px-5 py-3 font-medium">Price</th>
                <th className="text-left px-5 py-3 font-medium">Stock</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : products.map((product) => {
                    const variant = product.variants[0];
                    const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
                    return (
                      <tr key={product.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {product.images[0]?.url ? (
                              <img
                                src={product.images[0].url}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover border border-gray-700 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-gray-600" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium leading-snug">{product.name}</p>
                              {product.isBestseller && (
                                <span className="text-[10px] text-brand-400">Bestseller</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400">{product.category.name}</td>
                        <td className="px-5 py-3.5 text-white">{formatCurrency(variant?.price ?? 0)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-medium ${totalStock === 0 ? "text-red-400" : totalStock < 10 ? "text-amber-400" : "text-green-400"}`}>
                            {totalStock}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${product.status === "ACTIVE" ? "bg-green-900/50 text-green-400" :
                              product.status === "DRAFT" ? "bg-gray-700 text-gray-400" :
                              "bg-red-900/50 text-red-400"}
                          `}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <button className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-700">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                            <button
                              onClick={() => setDeleteId(product.id)}
                              className="text-gray-400 hover:text-red-400 p-1.5 rounded hover:bg-gray-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        {!loading && products.length === 0 && (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Archive Product"
        description="This will hide the product from the storefront. You can restore it later."
        confirmLabel="Archive"
        danger
      />
    </div>
  );
}
