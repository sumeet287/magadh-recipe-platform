"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: { name: string; email: string } | null;
  items: Array<{ product: { name: string } }>;
  shipping: { city: string; state: string } | null;
}

const ORDER_STATUSES = Object.keys(ORDER_STATUS_CONFIG);

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    setOrders(data.data ?? []);
    setTotal(data.meta?.total ?? 0);
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Orders</h1>
          <p className="text-sm text-gray-400 mt-1">{total} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => { setStatusFilter(""); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!statusFilter ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
        >
          All
        </button>
        {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].map((s) => {
          const config = ORDER_STATUS_CONFIG[s as keyof typeof ORDER_STATUS_CONFIG];
          return (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
            >
              {config?.label ?? s}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs">
                <th className="text-left px-5 py-3 font-medium">Order</th>
                <th className="text-left px-5 py-3 font-medium">Customer</th>
                <th className="text-left px-5 py-3 font-medium">Items</th>
                <th className="text-left px-5 py-3 font-medium">Amount</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-right px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : orders.map((order) => {
                    const config = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG];
                    return (
                      <tr key={order.id} className="hover:bg-gray-800/40">
                        <td className="px-5 py-3.5">
                          <p className="text-white font-medium">{order.orderNumber}</p>
                          {order.shipping && (
                            <p className="text-[11px] text-gray-500">{order.shipping.city}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-gray-300">{order.user?.name ?? "—"}</p>
                          <p className="text-[11px] text-gray-500 truncate max-w-[140px]">{order.user?.email}</p>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400">
                          {order.items[0]?.product.name}
                          {order.items.length > 1 && ` +${order.items.length - 1}`}
                        </td>
                        <td className="px-5 py-3.5 text-white font-medium">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config?.color ?? "text-gray-400"}`}>
                            {config?.label ?? order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">
                          {new Date(order.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link href={`/admin/orders/${order.id}`}>
                            <button className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-700">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        {!loading && orders.length === 0 && (
          <div className="py-16 text-center text-gray-500">No orders found</div>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Page {page} of {Math.ceil(total / 20)}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
