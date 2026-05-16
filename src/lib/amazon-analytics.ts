/**
 * Aggregates Amazon marketplace snapshots into the shapes used by
 * `/admin/analytics?channel=amazon`. Data originates from synced SP-API
 * rows (cron/script) stored in Postgres — independent of storefront Order.
 */

import type { AmazonMarketplaceOrder, AmazonMarketplaceOrderLine } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { DateRange } from "@/lib/analytics";
import { enumerateDays, previousPeriod, toLocalDateKey } from "@/lib/analytics";

function isCanceledStatus(status: string) {
  return status.toUpperCase().includes("CANCEL");
}

function isAfN(channel: string | null | undefined) {
  if (!channel) return false;
  const c = channel.toUpperCase();
  return c === "AFN" || c.includes("AMAZON");
}

function fulfillmentLabel(channel: string | null | undefined) {
  if (!channel) return "Amazon (mixed / unknown)";
  const c = channel.toUpperCase();
  if (c === "AFN" || c.includes("AMAZON")) return "FBA · Amazon‑fulfilled (AFN)";
  if (c === "MFN" || c === "DEFAULT") return "FBM · Merchant‑fulfilled (MFN)";
  return `${channel}`;
}

/** True after at least one row exists (optional hint UX). */
export async function amazonHasAnySnapshots(): Promise<boolean> {
  const n = await prisma.amazonMarketplaceOrder.count();
  return n > 0;
}

/** Orders falling in purchase window (before cancel filter). */
export async function amazonOrdersForRange(
  range: DateRange
): Promise<Array<AmazonMarketplaceOrder & { lines: AmazonMarketplaceOrderLine[] }>> {
  return prisma.amazonMarketplaceOrder.findMany({
    where: {
      purchaseDate: { gte: range.from, lte: range.to },
    },
    include: { lines: true },
    orderBy: { purchaseDate: "desc" },
  });
}

export interface AmazonHeadlineMetrics {
  /** Sum of marketplace order totals (buyer-visible subtotal/order total synced). Amazon fees/refunds excluded. */
  grossRevenue: number;
  netRevenue: number;
  amazonOrdersCounted: number;
  totalIncludingCanceled: number;
  canceledOrders: number;
  avgOrderValue: number;
  shipToLocales: number;
  fbaOrders: number;
  fbmOrders: number;
  fulfillmentKnown: number;
  unitsSold: number;
  avgItemsPerRealizedOrder: number;
}

export async function getAmazonHeadlineMetrics(range: DateRange): Promise<AmazonHeadlineMetrics> {
  const orders = await amazonOrdersForRange(range);
  const totalIncludingCanceled = orders.length;
  const canceledOrders = orders.filter((o) => isCanceledStatus(o.orderStatus)).length;
  const realized = orders.filter((o) => !isCanceledStatus(o.orderStatus));

  const grossRevenue = realized.reduce((s, o) => s + (o.orderTotalBuyer ?? 0), 0);
  const amazonOrdersCounted = realized.length;
  const avgOrderValue = amazonOrdersCounted > 0 ? grossRevenue / amazonOrdersCounted : 0;

  const shipKeys = new Set<string>();
  for (const o of realized) {
    const city = (o.shipCity ?? "").trim();
    const st = (o.shipState ?? "").trim();
    if (!city && !st) continue;
    shipKeys.add(`${city.toLowerCase()}|${st.toLowerCase()}`);
  }

  let fbaOrders = 0;
  let fbmOrders = 0;
  let fulfillmentKnown = 0;
  for (const o of realized) {
    if (!o.fulfillmentChannel) continue;
    fulfillmentKnown++;
    if (isAfN(o.fulfillmentChannel)) fbaOrders += 1;
    else fbmOrders += 1;
  }

  let unitsSold = 0;
  for (const o of realized) {
    for (const li of o.lines) {
      unitsSold += Math.max(0, li.quantity);
    }
  }
  const avgItemsPerRealizedOrder =
    amazonOrdersCounted > 0 ? unitsSold / amazonOrdersCounted : 0;

  return {
    grossRevenue,
    netRevenue: grossRevenue,
    amazonOrdersCounted,
    totalIncludingCanceled,
    canceledOrders,
    avgOrderValue,
    shipToLocales: shipKeys.size,
    fbaOrders,
    fbmOrders,
    fulfillmentKnown,
    unitsSold,
    avgItemsPerRealizedOrder,
  };
}

export interface AmazonDailyPoint {
  date: string;
  revenue: number;
  orders: number;
}

export async function getAmazonDailyTimeline(range: DateRange): Promise<AmazonDailyPoint[]> {
  const orders = await amazonOrdersForRange(range);
  const realized = orders.filter((o) => !isCanceledStatus(o.orderStatus));

  const map = new Map<string, { revenue: number; orders: number }>();
  for (const day of enumerateDays(range)) {
    map.set(toLocalDateKey(day), { revenue: 0, orders: 0 });
  }

  for (const o of realized) {
    const key = toLocalDateKey(o.purchaseDate);
    const bucket = map.get(key);
    if (!bucket) continue;
    bucket.revenue += o.orderTotalBuyer ?? 0;
    bucket.orders += 1;
  }

  return Array.from(map.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface AmazonStatusRow {
  status: string;
  count: number;
  revenue: number;
}

export async function getAmazonStatusBreakdown(range: DateRange): Promise<AmazonStatusRow[]> {
  const orders = await amazonOrdersForRange(range);
  const map = new Map<string, { count: number; revenue: number }>();
  for (const o of orders) {
    const k = o.orderStatus || "UNKNOWN";
    const row = map.get(k) ?? { count: 0, revenue: 0 };
    row.count += 1;
    row.revenue += o.orderTotalBuyer ?? 0;
    map.set(k, row);
  }
  return [...map.entries()]
    .map(([status, v]) => ({ status, ...v }))
    .sort((a, b) => b.count - a.count);
}

export interface AmazonChannelRow {
  channel: string;
  displayLabel: string;
  count: number;
  revenue: number;
}

export async function getAmazonFulfillmentBreakdown(range: DateRange): Promise<AmazonChannelRow[]> {
  const orders = await amazonOrdersForRange(range);
  const realized = orders.filter((o) => !isCanceledStatus(o.orderStatus));

  const map = new Map<string, { label: string; count: number; revenue: number }>();
  for (const o of realized) {
    const key = o.fulfillmentChannel ?? "UNKNOWN";
    const label = fulfillmentLabel(o.fulfillmentChannel);
    const row = map.get(key) ?? { label, count: 0, revenue: 0 };
    row.count += 1;
    row.revenue += o.orderTotalBuyer ?? 0;
    map.set(key, row);
  }
  return [...map.entries()]
    .map(([channel, v]) => ({
      channel,
      displayLabel: v.label,
      count: v.count,
      revenue: v.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export interface AmazonGeoRow {
  name: string;
  state?: string;
  orders: number;
  revenue: number;
}

export async function getAmazonCityBreakdown(range: DateRange, limit = 12): Promise<AmazonGeoRow[]> {
  const orders = await amazonOrdersForRange(range);
  const realized = orders.filter((o) => !isCanceledStatus(o.orderStatus));

  const map = new Map<string, AmazonGeoRow>();
  for (const o of realized) {
    const city = (o.shipCity ?? "Unknown").trim();
    const st = (o.shipState ?? "").trim();
    const key = `${city.toLowerCase()}|${st.toLowerCase()}`;
    const row = map.get(key) ?? { name: city, state: st, orders: 0, revenue: 0 };
    row.orders += 1;
    row.revenue += o.orderTotalBuyer ?? 0;
    map.set(key, row);
  }

  return [...map.values()].sort((a, b) => b.orders - a.orders).slice(0, limit);
}

export async function getAmazonStateBreakdown(range: DateRange, limit = 10): Promise<AmazonGeoRow[]> {
  const orders = await amazonOrdersForRange(range);
  const realized = orders.filter((o) => !isCanceledStatus(o.orderStatus));

  const map = new Map<string, AmazonGeoRow>();
  for (const o of realized) {
    const st = (o.shipState ?? "Unknown").trim();
    const key = st.toLowerCase();
    const row = map.get(key) ?? { name: st, orders: 0, revenue: 0 };
    row.orders += 1;
    row.revenue += o.orderTotalBuyer ?? 0;
    map.set(key, row);
  }

  return [...map.values()].sort((a, b) => b.orders - a.orders).slice(0, limit);
}

export interface AmazonTopSkuRow {
  skuKey: string;
  label: string;
  quantity: number;
  revenue: number;
}

export async function getAmazonTopSkus(range: DateRange, limit = 10): Promise<AmazonTopSkuRow[]> {
  const orders = await amazonOrdersForRange(range);
  const realized = orders.filter((o) => !isCanceledStatus(o.orderStatus));

  const map = new Map<string, AmazonTopSkuRow>();
  for (const o of realized) {
    for (const li of o.lines) {
      const key = li.sku?.trim() || li.title?.trim() || "NO_SKU";
      const existing = map.get(key) ?? {
        skuKey: key,
        label: li.title?.trim() || li.sku || "SKU",
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += Math.max(0, li.quantity);
      existing.revenue += li.itemSubtotal ?? 0;
      existing.label = li.title?.trim() || existing.label;
      map.set(key, existing);
    }
  }

  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

/** Deep link into Seller Central order detail (India vs global hostname). */
export function amazonSellerCentralOrderUrl(marketplace: "IN" | "DEFAULT", amazonOrderId: string) {
  const id = amazonOrderId.trim();
  const enc = encodeURIComponent(id);
  if (marketplace === "IN") {
    return `https://sellercentral.amazon.in/orders-v3/order/${enc}`;
  }
  return `https://sellercentral.amazon.com/orders-v3/order/${enc}`;
}

export async function getAmazonRecentOrders(range: DateRange, limit = 10) {
  const orders = await amazonOrdersForRange(range);
  return orders.slice(0, limit).map((o) => ({
    amazonOrderId: o.amazonOrderId,
    purchaseDate: o.purchaseDate,
    orderStatus: o.orderStatus,
    orderTotalBuyer: o.orderTotalBuyer,
    shipCity: o.shipCity,
    shipState: o.shipState,
  }));
}
