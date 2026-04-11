import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, Package, CheckCircle } from "lucide-react";

export const metadata = { title: "Inventory | Magadh Recipe Admin" };

export default async function AdminInventoryPage() {
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
    include: { product: { select: { name: true, slug: true, status: true } } },
    orderBy: { stock: "asc" },
  });

  const outOfStock = variants.filter((v) => v.stock === 0);
  const lowStock = variants.filter((v) => v.stock > 0 && v.stock <= v.lowStockAlert);
  const healthy = variants.filter((v) => v.stock > v.lowStockAlert);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Inventory</h1>
        <p className="text-gray-400 text-sm mt-1">Stock levels across all variants</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-900/40 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{outOfStock.length}</p>
              <p className="text-xs text-gray-500">Out of Stock</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900/40 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{lowStock.length}</p>
              <p className="text-xs text-gray-500">Low Stock</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-900/40 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{healthy.length}</p>
              <p className="text-xs text-gray-500">Healthy Stock</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">All Variants</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-6 py-3 font-medium">Product</th>
              <th className="px-6 py-3 font-medium">Variant</th>
              <th className="px-6 py-3 font-medium">SKU</th>
              <th className="px-6 py-3 font-medium">Price</th>
              <th className="px-6 py-3 font-medium">Stock</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {variants.map((v) => {
              const status =
                v.stock === 0 ? "out" : v.stock <= v.lowStockAlert ? "low" : "ok";
              return (
                <tr key={v.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3.5 text-white font-medium max-w-[250px] truncate">{v.product.name}</td>
                  <td className="px-6 py-3.5 text-gray-300">{v.name}</td>
                  <td className="px-6 py-3.5 text-gray-400 font-mono text-xs">{v.sku}</td>
                  <td className="px-6 py-3.5 text-gray-300">{formatCurrency(v.price)}</td>
                  <td className="px-6 py-3.5">
                    <span className={`font-bold ${status === "out" ? "text-red-400" : status === "low" ? "text-amber-400" : "text-green-400"}`}>
                      {v.stock}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      status === "out" ? "bg-red-900/40 text-red-400" :
                      status === "low" ? "bg-amber-900/40 text-amber-400" :
                      "bg-green-900/40 text-green-400"
                    }`}>
                      {status === "out" ? "Out of Stock" : status === "low" ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
