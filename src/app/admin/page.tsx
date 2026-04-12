import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import { TrendingUp, TrendingDown, ShoppingBag, Users, DollarSign, Package } from "lucide-react";

export const metadata = { title: "Dashboard | Magadh Recipe Admin" };

export default async function AdminDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalOrders,
    pendingOrders,
    totalCustomers,
    newCustomers,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] }, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: startOfMonth } } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const thisMonth = monthRevenue._sum.totalAmount ?? 0;
  const lastMonth = lastMonthRevenue._sum.totalAmount ?? 0;
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue._sum.totalAmount ?? 0),
      sub: `${formatCurrency(thisMonth)} this month`,
      icon: DollarSign,
      trend: growth,
      color: "bg-green-900/40 text-green-400",
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      sub: `${pendingOrders} pending action`,
      icon: ShoppingBag,
      color: "bg-blue-900/40 text-blue-400",
    },
    {
      title: "Customers",
      value: totalCustomers.toLocaleString(),
      sub: `${newCustomers} new this month`,
      icon: Users,
      color: "bg-purple-900/40 text-purple-400",
    },
    {
      title: "Pending Orders",
      value: pendingOrders.toLocaleString(),
      sub: "Needs attention",
      icon: Package,
      color: "bg-amber-900/40 text-amber-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Welcome back — here&apos;s what&apos;s happening with Magadh Recipe.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map(({ title, value, sub, icon: Icon, trend, color }) => (
          <div key={title} className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              {trend !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(Math.round(trend))}%
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{title}</p>
            <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-white">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-brand-400 hover:text-brand-300">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-800">
          {recentOrders.map((order) => {
            const config = ORDER_STATUS_CONFIG[order.status];
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-800/50 transition-colors"
              >
                <div>
                  <p className="text-sm text-white font-medium">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.user?.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${config?.color ?? "text-gray-400"}`}>
                    {config?.label ?? order.status}
                  </span>
                  <span className="text-sm text-white font-medium">{formatCurrency(order.totalAmount)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
