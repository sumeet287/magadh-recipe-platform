/**
 * Pulls orders from Amazon Selling Partner Orders API (v0) into
 * `amazon_marketplace_orders` + lines for the admin Amazon analytics tab.
 *
 * Requires Login with Amazon app credentials + seller refresh token.
 * @see https://developer-docs.amazon.com/sp-api/docs/connecting-to-the-selling-partner-api
 */

import { SellingPartnerApiAuth } from "@sp-api-sdk/auth";
import type { SellingPartnerRegion } from "@sp-api-sdk/common";
import { SellingPartnerApiError } from "@sp-api-sdk/common";
import { OrdersApiClient } from "@sp-api-sdk/orders-api-v0";
import type { Money, Order, OrderItem } from "@sp-api-sdk/orders-api-v0";

import { prisma } from "@/lib/prisma";

const DEFAULT_MARKETPLACE_IN = "A21TJRUUN4KGV";
const DEFAULT_LOOKBACK_DAYS = 21;
const DEFAULT_MAX_LIST_PAGES = 8;
const DEFAULT_MAX_ORDER_ITEM_FETCHES = 40;

function envInt(name: string, fallback: number): number {
  const v = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function parseMoney(m?: Money): { amount: number; currency: string } {
  const currency = m?.CurrencyCode?.trim() || "INR";
  const raw = m?.Amount;
  const amount = raw === undefined || raw === "" ? 0 : Number.parseFloat(raw);
  return { amount: Number.isFinite(amount) ? amount : 0, currency };
}

export function isAmazonSpApiConfigured(): boolean {
  return Boolean(
    process.env.LWA_CLIENT_ID?.trim() &&
      process.env.LWA_CLIENT_SECRET?.trim() &&
      process.env.LWA_REFRESH_TOKEN?.trim()
  );
}

function resolveRegion(): SellingPartnerRegion {
  const r = process.env.AMAZON_SP_API_REGION?.trim().toLowerCase();
  if (r === "na" || r === "fe" || r === "eu") return r;
  return "eu";
}

function readRequiredLwaEnv(): { clientId: string; clientSecret: string; refreshToken: string } {
  const clientId = process.env.LWA_CLIENT_ID?.trim();
  const clientSecret = process.env.LWA_CLIENT_SECRET?.trim();
  const refreshToken = process.env.LWA_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("LWA_CLIENT_ID, LWA_CLIENT_SECRET, and LWA_REFRESH_TOKEN must be set");
  }
  return { clientId, clientSecret, refreshToken };
}

function createOrdersClient(): OrdersApiClient {
  const { clientId, clientSecret, refreshToken } = readRequiredLwaEnv();
  const auth = new SellingPartnerApiAuth({
    clientId,
    clientSecret,
    refreshToken,
  });
  return new OrdersApiClient({
    auth,
    region: resolveRegion(),
    sandbox: process.env.AMAZON_SP_API_SANDBOX === "true",
    rateLimiting: { retry: true },
  });
}

function marketplaceIds(): string[] {
  const id = process.env.AMAZON_MARKETPLACE_ID?.trim() || DEFAULT_MARKETPLACE_IN;
  return [id];
}

function orderHeaderFromSpApi(o: Order) {
  const total = parseMoney(o.OrderTotal);
  const ship = o.ShippingAddress;
  return {
    amazonOrderId: o.AmazonOrderId,
    purchaseDate: new Date(o.PurchaseDate),
    orderStatus: String(o.OrderStatus),
    orderCurrency: total.currency,
    orderTotalBuyer: total.amount,
    fulfillmentChannel: o.FulfillmentChannel ? String(o.FulfillmentChannel).toUpperCase() : null,
    shipCity: ship?.City?.trim() || null,
    shipState: ship?.StateOrRegion?.trim() || null,
  };
}

async function fetchAllOrderItems(client: OrdersApiClient, amazonOrderId: string): Promise<OrderItem[]> {
  const items: OrderItem[] = [];
  let nextToken: string | undefined;
  for (;;) {
    const { data } = await client.getOrderItems({ orderId: amazonOrderId, nextToken }, {});
    const payload = data.payload;
    if (payload?.OrderItems?.length) items.push(...payload.OrderItems);
    nextToken = payload?.NextToken;
    if (!nextToken) break;
  }
  return items;
}

export interface AmazonOrdersSyncResult {
  ok: boolean;
  error?: string;
  /** ISO range start used for lastUpdatedAfter */
  lastUpdatedAfter?: string;
  ordersSeen: number;
  ordersUpserted: number;
  orderItemFetches: number;
  lineRowsWritten: number;
  listPages: number;
}

/**
 * Syncs recently updated orders into the local DB.
 * Headers come from `getOrders`; line items are fetched for the most recently
 * updated subset only (rate limits + cron time budget).
 */
export async function syncAmazonOrdersFromSpApi(overrides?: {
  lookbackDays?: number;
  maxListPages?: number;
  maxOrderItemFetches?: number;
}): Promise<AmazonOrdersSyncResult> {
  if (!isAmazonSpApiConfigured()) {
    return {
      ok: false,
      error:
        "Missing LWA credentials: set LWA_CLIENT_ID, LWA_CLIENT_SECRET, and LWA_REFRESH_TOKEN (see .env.example).",
      ordersSeen: 0,
      ordersUpserted: 0,
      orderItemFetches: 0,
      lineRowsWritten: 0,
      listPages: 0,
    };
  }

  const lookbackDays = overrides?.lookbackDays ?? envInt("AMAZON_ORDERS_SYNC_LOOKBACK_DAYS", DEFAULT_LOOKBACK_DAYS);
  const maxListPages = overrides?.maxListPages ?? envInt("AMAZON_ORDERS_SYNC_MAX_LIST_PAGES", DEFAULT_MAX_LIST_PAGES);
  const maxOrderItemFetches =
    overrides?.maxOrderItemFetches ??
    envInt("AMAZON_ORDERS_SYNC_MAX_ORDER_ITEM_FETCHES", DEFAULT_MAX_ORDER_ITEM_FETCHES);

  const lastUpdatedAfter = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  const client = createOrdersClient();
  const collected: Order[] = [];
  let listPages = 0;
  let nextToken: string | undefined;

  try {
    for (let page = 0; page < maxListPages; page++) {
      const { data } = await client.getOrders(
        {
          marketplaceIds: marketplaceIds(),
          lastUpdatedAfter,
          maxResultsPerPage: 100,
          nextToken,
        },
        {}
      );
      listPages += 1;
      const orders = data.payload?.Orders ?? [];
      collected.push(...orders);
      nextToken = data.payload?.NextToken;
      if (!nextToken) break;
    }
  } catch (e) {
    return {
      ok: false,
      error: formatSpApiFailure(e),
      lastUpdatedAfter,
      ordersSeen: collected.length,
      ordersUpserted: 0,
      orderItemFetches: 0,
      lineRowsWritten: 0,
      listPages,
    };
  }

  // Newest activity first — line-item detail is the heaviest call.
  collected.sort(
    (a, b) => new Date(b.LastUpdateDate).getTime() - new Date(a.LastUpdateDate).getTime()
  );

  const detailTargets = new Set(
    collected.slice(0, maxOrderItemFetches).map((o) => o.AmazonOrderId)
  );

  let ordersUpserted = 0;
  let orderItemFetches = 0;
  let lineRowsWritten = 0;

  for (const o of collected) {
    const header = orderHeaderFromSpApi(o);
    try {
      const row = await prisma.amazonMarketplaceOrder.upsert({
        where: { amazonOrderId: header.amazonOrderId },
        create: { ...header },
        update: {
          purchaseDate: header.purchaseDate,
          orderStatus: header.orderStatus,
          orderCurrency: header.orderCurrency,
          orderTotalBuyer: header.orderTotalBuyer,
          fulfillmentChannel: header.fulfillmentChannel,
          shipCity: header.shipCity,
          shipState: header.shipState,
        },
      });
      ordersUpserted += 1;

      if (!detailTargets.has(header.amazonOrderId)) continue;

      let items: OrderItem[] = [];
      try {
        orderItemFetches += 1;
        items = await fetchAllOrderItems(client, header.amazonOrderId);
      } catch {
        continue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.amazonMarketplaceOrderLine.deleteMany({
          where: { amazonOrderDbId: row.id },
        });
        if (items.length === 0) return;
        await tx.amazonMarketplaceOrderLine.createMany({
          data: items.map((li) => {
            const price = parseMoney(li.ItemPrice);
            return {
              amazonOrderDbId: row.id,
              sku: li.SellerSKU ?? null,
              title: li.Title ?? null,
              quantity: Math.max(0, li.QuantityOrdered ?? 0),
              itemSubtotal: price.amount,
            };
          }),
        });
      });
      lineRowsWritten += items.length;
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Database error during Amazon order upsert",
        lastUpdatedAfter,
        ordersSeen: collected.length,
        ordersUpserted,
        orderItemFetches,
        lineRowsWritten,
        listPages,
      };
    }
  }

  return {
    ok: true,
    lastUpdatedAfter,
    ordersSeen: collected.length,
    ordersUpserted,
    orderItemFetches,
    lineRowsWritten,
    listPages,
  };
}

function formatSpApiFailure(err: unknown): string {
  if (err instanceof SellingPartnerApiError) {
    const parts = [err.innerMessage || err.message];
    const data = err.response?.data as { errors?: Array<{ code?: string; message?: string }> } | undefined;
    const amz = data?.errors?.[0];
    if (amz?.message) parts.push(amz.message);
    if (amz?.code) parts.push(`(${amz.code})`);
    return parts.filter(Boolean).join(" ");
  }
  if (err instanceof Error) return err.message;
  return "Unknown SP-API error";
}
