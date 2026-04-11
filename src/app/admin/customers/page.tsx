import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Users, ShoppingBag, Star } from "lucide-react";

export const metadata = { title: "Customers | Magadh Recipe Admin" };

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true, reviews: true } },
      orders: {
        where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
        select: { totalAmount: true },
      },
    },
  });

  const mapped = customers.map((c) => ({
    ...c,
    totalSpent: c.orders.reduce((sum, o) => sum + o.totalAmount, 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Customers</h1>
          <p className="text-gray-400 text-sm mt-1">{mapped.length} registered customers</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-left">
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Phone</th>
              <th className="px-6 py-3 font-medium">Orders</th>
              <th className="px-6 py-3 font-medium">Total Spent</th>
              <th className="px-6 py-3 font-medium">Reviews</th>
              <th className="px-6 py-3 font-medium">Joined</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {mapped.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No customers yet
                </td>
              </tr>
            ) : (
              mapped.map((c) => (
                <tr key={c.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {c.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{c.name ?? "—"}</p>
                        <p className="text-gray-500 text-xs truncate">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-gray-400 text-xs">{c.phone ?? "—"}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {c._count.orders}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-white font-medium">{formatCurrency(c.totalSpent)}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Star className="w-3.5 h-3.5" />
                      {c._count.reviews}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-gray-400 text-xs">
                    {c.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                      {c.isActive ? "Active" : "Blocked"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
