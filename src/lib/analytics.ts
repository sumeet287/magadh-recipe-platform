/**
 * Analytics queries for the admin reporting dashboard.
 *
 * Design:
 * - All revenue metrics use a single "realized" definition: orders that are not
 *   CANCELLED / FAILED / PENDING, minus any refund amounts captured on Payment.
 *   This gives us a conservative view of money that actually landed.
 * - Returns/refunds are tracked as a separate funnel metric (return rate).
 * - Every metric function accepts a DateRange and is safe to run in parallel.
 */

import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ==================== Date Ranges ====================

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_month"
  | "last_month"
  | "this_quarter"
  | "this_year"
  | "all_time"
  | "custom";

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
  preset: DateRangePreset;
}

export const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_quarter", label: "This quarter" },
  { value: "this_year", label: "This year" },
  { value: "all_time", label: "All time" },
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Resolves a date range from URL search params. Defaults to last_30_days. */
export function resolveDateRange(params: {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
}): DateRange {
  const preset = (params.preset as DateRangePreset | undefined) ?? "last_30_days";
  const now = new Date();

  if (preset === "custom" && params.from && params.to) {
    return {
      from: startOfDay(new Date(params.from)),
      to: endOfDay(new Date(params.to)),
      label: `${params.from} → ${params.to}`,
      preset: "custom",
    };
  }

  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now), label: "Today", preset };
    case "yesterday": {
      const y = addDays(now, -1);
      return { from: startOfDay(y), to: endOfDay(y), label: "Yesterday", preset };
    }
    case "last_7_days":
      return {
        from: startOfDay(addDays(now, -6)),
        to: endOfDay(now),
        label: "Last 7 days",
        preset,
      };
    case "last_30_days":
      return {
        from: startOfDay(addDays(now, -29)),
        to: endOfDay(now),
        label: "Last 30 days",
        preset,
      };
    case "last_90_days":
      return {
        from: startOfDay(addDays(now, -89)),
        to: endOfDay(now),
        label: "Last 90 days",
        preset,
      };
    case "this_month":
      return {
        from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: endOfDay(now),
        label: "This month",
        preset,
      };
    case "last_month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(from), to: endOfDay(to), label: "Last month", preset };
    }
    case "this_quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), q * 3, 1);
      return {
        from: startOfDay(from),
        to: endOfDay(now),
        label: "This quarter",
        preset,
      };
    }
    case "this_year":
      return {
        from: startOfDay(new Date(now.getFullYear(), 0, 1)),
        to: endOfDay(now),
        label: "This year",
        preset,
      };
    case "all_time":
      return {
        from: new Date(2000, 0, 1),
        to: endOfDay(now),
        label: "All time",
        preset,
      };
    default:
      return {
        from: startOfDay(addDays(now, -29)),
        to: endOfDay(now),
        label: "Last 30 days",
        preset: "last_30_days",
      };
  }
}

/** Returns the comparison period (same length, immediately preceding). */
export function previousPeriod(range: DateRange): DateRange {
  const spanMs = range.to.getTime() - range.from.getTime();
  const to = new Date(range.from.getTime() - 1);
  const from = new Date(to.getTime() - spanMs);
  return { from, to, label: "Previous period", preset: "custom" };
}

/** Returns an array of Date objects covering each day in the range (UTC midnight). */
export function enumerateDays(range: DateRange): Date[] {
  const days: Date[] = [];
  const cursor = startOfDay(range.from);
  const end = startOfDay(range.to);
  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Formats a Date as YYYY-MM-DD in local time. */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ==================== Status Buckets ====================

/** Orders counted as "paid" / real revenue — payment landed or will land. */
export const REALIZED_ORDER_STATUSES: OrderStatus[] = [
  "CONFIRMED",
  "PAID",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUND_INITIATED",
  "REFUNDED",
];

/** Orders we exclude from revenue (never collected). */
export const LOST_ORDER_STATUSES: OrderStatus[] = ["PENDING", "CANCELLED", "FAILED"];

/** Orders counted as refunded / returned (for return-rate numerator). */
export const RETURN_ORDER_STATUSES: OrderStatus[] = [
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUND_INITIATED",
  "REFUNDED",
];

/** Orders counted as cancelled (for cancel-rate numerator). */
export const CANCEL_ORDER_STATUSES: OrderStatus[] = ["CANCELLED", "FAILED"];

// ==================== Metrics ====================

export interface HeadlineMetrics {
  grossRevenue: number;
  netRevenue: number; // gross - refunds
  totalOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  refundAmount: number;
  avgOrderValue: number;
  uniqueCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  returnRate: number; // % of paid orders returned
  cancelRate: number; // % of total orders cancelled
  repeatRate: number; // % of paying customers who are repeat
}

export async function getHeadlineMetrics(range: DateRange): Promise<HeadlineMetrics> {
  const where: Prisma.OrderWhereInput = {
    createdAt: { gte: range.from, lte: range.to },
  };

  const [allOrders, paidAgg, cancelledCount, returnedCount, refundAgg, uniqueCustomerAgg, newCustomerCount] =
    await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: { ...where, status: { in: REALIZED_ORDER_STATUSES } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.order.count({ where: { ...where, status: { in: CANCEL_ORDER_STATUSES } } }),
      prisma.order.count({ where: { ...where, status: { in: RETURN_ORDER_STATUSES } } }),
      prisma.payment.aggregate({
        where: {
          refundedAt: { gte: range.from, lte: range.to, not: null },
        },
        _sum: { refundAmount: true },
      }),
      prisma.order.findMany({
        where: { ...where, status: { in: REALIZED_ORDER_STATUSES } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: range.from, lte: range.to },
        },
      }),
    ]);

  const grossRevenue = paidAgg._sum.totalAmount ?? 0;
  const refundAmount = refundAgg._sum.refundAmount ?? 0;
  const netRevenue = Math.max(0, grossRevenue - refundAmount);
  const paidOrders = paidAgg._count._all;
  const avgOrderValue = paidOrders > 0 ? grossRevenue / paidOrders : 0;
  const uniqueCustomers = uniqueCustomerAgg.length;

  // A repeat customer is someone whose most recent order in this range isn't their first order ever.
  const uniqueUserIds = uniqueCustomerAgg.map((u) => u.userId);
  let repeatCustomers = 0;
  if (uniqueUserIds.length > 0) {
    const priorOrders = await prisma.order.findMany({
      where: {
        userId: { in: uniqueUserIds },
        createdAt: { lt: range.from },
        status: { in: REALIZED_ORDER_STATUSES },
      },
      select: { userId: true },
      distinct: ["userId"],
    });
    repeatCustomers = priorOrders.length;
  }
  const newPayingCustomers = uniqueCustomers - repeatCustomers;
  const repeatRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;
  const returnRate = paidOrders > 0 ? (returnedCount / paidOrders) * 100 : 0;
  const cancelRate = allOrders > 0 ? (cancelledCount / allOrders) * 100 : 0;

  return {
    grossRevenue,
    netRevenue,
    totalOrders: allOrders,
    paidOrders,
    cancelledOrders: cancelledCount,
    returnedOrders: returnedCount,
    refundAmount,
    avgOrderValue,
    uniqueCustomers,
    newCustomers: Math.max(newPayingCustomers, newCustomerCount),
    repeatCustomers,
    returnRate,
    cancelRate,
    repeatRate,
  };
}

// ==================== Daily timeline ====================

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
}

export async function getDailyTimeline(range: DateRange): Promise<DailyPoint[]> {
  const rows = await prisma.order.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      status: { in: REALIZED_ORDER_STATUSES },
    },
    select: { createdAt: true, totalAmount: true },
  });

  const map = new Map<string, { revenue: number; orders: number }>();
  for (const day of enumerateDays(range)) {
    map.set(toLocalDateKey(day), { revenue: 0, orders: 0 });
  }
  for (const r of rows) {
    const key = toLocalDateKey(r.createdAt);
    const entry = map.get(key);
    if (entry) {
      entry.revenue += r.totalAmount;
      entry.orders += 1;
    }
  }
  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
}

// ==================== Status breakdown ====================

export interface StatusBreakdownRow {
  status: OrderStatus;
  count: number;
  revenue: number;
}

export async function getStatusBreakdown(range: DateRange): Promise<StatusBreakdownRow[]> {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    where: { createdAt: { gte: range.from, lte: range.to } },
    _count: { _all: true },
    _sum: { totalAmount: true },
  });

  return rows
    .map((r) => ({
      status: r.status,
      count: r._count._all,
      revenue: r._sum.totalAmount ?? 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// ==================== Payment method breakdown ====================

export interface PaymentMethodRow {
  method: string;
  count: number;
  revenue: number;
}

export async function getPaymentMethodBreakdown(range: DateRange): Promise<PaymentMethodRow[]> {
  const rows = await prisma.order.groupBy({
    by: ["paymentMethod"],
    where: {
      createdAt: { gte: range.from, lte: range.to },
      status: { in: REALIZED_ORDER_STATUSES },
    },
    _count: { _all: true },
    _sum: { totalAmount: true },
  });

  return rows
    .map((r) => ({
      method: r.paymentMethod,
      count: r._count._all,
      revenue: r._sum.totalAmount ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ==================== Geography (city + state) ====================

export interface GeoRow {
  name: string;
  state?: string;
  orders: number;
  revenue: number;
}

export async function getCityBreakdown(range: DateRange, limit = 15): Promise<GeoRow[]> {
  const rows = await prisma.order.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      status: { in: REALIZED_ORDER_STATUSES },
      shipping: { isNot: null },
    },
    select: {
      totalAmount: true,
      shipping: { select: { city: true, state: true } },
    },
  });

  const map = new Map<string, GeoRow>();
  for (const r of rows) {
    if (!r.shipping) continue;
    const city = (r.shipping.city || "Unknown").trim();
    const state = (r.shipping.state || "").trim();
    const key = `${city.toLowerCase()}|${state.toLowerCase()}`;
    const existing = map.get(key) ?? { name: city, state, orders: 0, revenue: 0 };
    existing.orders += 1;
    existing.revenue += r.totalAmount;
    map.set(key, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => b.orders - a.orders)
    .slice(0, limit);
}

export async function getStateBreakdown(range: DateRange, limit = 15): Promise<GeoRow[]> {
  const rows = await prisma.order.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      status: { in: REALIZED_ORDER_STATUSES },
      shipping: { isNot: null },
    },
    select: {
      totalAmount: true,
      shipping: { select: { state: true } },
    },
  });

  const map = new Map<string, GeoRow>();
  for (const r of rows) {
    if (!r.shipping) continue;
    const state = (r.shipping.state || "Unknown").trim();
    const key = state.toLowerCase();
    const existing = map.get(key) ?? { name: state, orders: 0, revenue: 0 };
    existing.orders += 1;
    existing.revenue += r.totalAmount;
    map.set(key, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => b.orders - a.orders)
    .slice(0, limit);
}

// ==================== Top products ====================

export interface TopProductRow {
  productId: string;
  name: string;
  slug: string | null;
  quantity: number;
  revenue: number;
}

export async function getTopProducts(range: DateRange, limit = 10): Promise<TopProductRow[]> {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId", "productName"],
    where: {
      order: {
        createdAt: { gte: range.from, lte: range.to },
        status: { in: REALIZED_ORDER_STATUSES },
      },
    },
    _sum: { quantity: true, totalPrice: true },
    orderBy: { _sum: { totalPrice: "desc" } },
    take: limit,
  });

  // Fetch slugs in one query
  const ids = grouped.map((g) => g.productId);
  const slugs =
    ids.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: ids } },
          select: { id: true, slug: true },
        })
      : [];
  const slugMap = new Map(slugs.map((s) => [s.id, s.slug]));

  return grouped.map((g) => ({
    productId: g.productId,
    name: g.productName,
    slug: slugMap.get(g.productId) ?? null,
    quantity: g._sum.quantity ?? 0,
    revenue: g._sum.totalPrice ?? 0,
  }));
}

// ==================== Recent orders ====================

export async function getRecentOrdersInRange(range: DateRange, limit = 12) {
  return prisma.order.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, email: true } },
      shipping: { select: { city: true, state: true } },
    },
  });
}
