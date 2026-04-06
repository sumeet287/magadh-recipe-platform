import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError, UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { successResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await auth();
    if (!session) throw new UnauthorizedError();
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") throw new ForbiddenError();

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
      topProducts,
      lowStockProducts,
    ] = await Promise.all([
      // Total revenue (confirmed orders)
      prisma.order.aggregate({
        where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
        _sum: { totalAmount: true },
      }),
      // This month revenue
      prisma.order.aggregate({
        where: {
          status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
          createdAt: { gte: startOfMonth },
        },
        _sum: { totalAmount: true },
      }),
      // Last month revenue
      prisma.order.aggregate({
        where: {
          status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { totalAmount: true },
      }),
      // Order counts
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } } }),
      // Customer counts
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: startOfMonth } } }),
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
      // Top products by order count
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: "desc" } },
        take: 5,
      }),
      // Low stock
      prisma.productVariant.findMany({
        where: { stock: { lte: prisma.productVariant.fields.lowStockAlert } },
        include: { product: { select: { name: true } } },
        take: 10,
      }),
    ]);

    // Fetch top product names
    const topProductIds = topProducts.map((t) => t.productId);
    const topProductNames = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } },
    });

    const topProductsWithNames = topProducts.map((t) => ({
      ...t,
      product: topProductNames.find((p) => p.id === t.productId),
    }));

    const thisMonthRev = monthRevenue._sum.totalAmount ?? 0;
    const lastMonthRev = lastMonthRevenue._sum.totalAmount ?? 1;
    const revenueGrowth = ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100;

    return NextResponse.json(
      successResponse({
        totalRevenue: totalRevenue._sum.totalAmount ?? 0,
        monthRevenue: thisMonthRev,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalOrders,
        pendingOrders,
        totalCustomers,
        newCustomers,
        recentOrders,
        topProducts: topProductsWithNames,
        lowStockProducts,
      })
    );
  } catch (err) {
    return handleApiError(err);
  }
}
