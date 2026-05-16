/**
 * Pulls orders from Amazon Selling Partner Orders API (v0) into
 * `amazon_marketplace_orders` + lines for the admin Amazon analytics tab.
 *
 * Requires Login with Amazon app credentials + seller refresh token.
 * @see https://developer-docs.amazon.com/sp-api/docs/connecting-to-the-selling-partner-api
 *
 * Listing modes:
 * - **Incremental (default)** — `LastUpdatedAfter` = now − lookbackDays. Good for cron + “pull latest”.
 * - **Historical (Created)** — `CreatedAfter/CreatedBefore` over a long span (≤ ~2 years for most marketplaces
 *   per Orders API docs) + exhausts pagination. Imports order headers; line items optional / capped separately.
 */

import { SellingPartnerApiAuth } from "@sp-api-sdk/auth";
import type { SellingPartnerRegion } from "@sp-api-sdk/common";
import { SellingPartnerApiError } from "@sp-api-sdk/common";
import { OrdersApiClient } from "@sp-api-sdk/orders-api-v0";
import type { Money, Order, OrderItem } from "@sp-api-sdk/orders-api-v0";

import { prisma } from "@/lib/prisma";

const DEFAULT_MARKETPLACE_IN = "A21TJRUUN4KGV";
/** Window for cron / incremental “recent changes” pulls */
const DEFAULT_LOOKBACK_DAYS = 21;
/** Max list-result pages when env does not disable the cap (~100 orders/page) */
const DEFAULT_MAX_LIST_PAGES = 8;
const DEFAULT_MAX_ORDER_ITEM_FETCHES = 40;

const TWO_MINUTES_MS = 2 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** India + most regions: Orders API exposes roughly the last ~2 years of orders */
const DEFAULT_HISTORICAL_CREATED_DAYS_MAX = 720;
/** Chunk to avoid brittle single huge windows — 0 disables chunking (one Created window) */
const DEFAULT_HISTORICAL_CHUNK_DAYS = 90;

function envInt(name: string, fallback: number): number {
  const v = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** `0` ⇒ one big Created window (no chunking). Any positive integer = chunk size in days. */
function envHistoricalChunkDays(fallback: number): number {
  const raw = process.env.AMAZON_ORDERS_HISTORICAL_CHUNK_DAYS?.trim();
  if (raw === undefined || raw === "") return fallback;
  const v = Number.parseInt(raw, 10);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

/** Default 0 ⇒ headers-first backfill (use `syncAmazonMissingMarketplaceLines` after). Set env to pull lines inline. */
function envHistoricalMaxOrderItemFetches(): number {
  const raw = process.env.AMAZON_ORDERS_HISTORICAL_MAX_ORDER_ITEM_FETCHES?.trim();
  if (raw === undefined || raw === "") return 0;
  const v = Number.parseInt(raw, 10);
  return Number.isFinite(v) && v >= 0 ? v : 0;
}

/**
 * Incremental pulls: bounded pages by default (`8`). Set `"0"` in env ⇒ exhaust `NextToken` (risk: long runs).
 */
function envIncrementalMaxListPages(): number | null {
  const raw = process.env.AMAZON_ORDERS_SYNC_MAX_LIST_PAGES?.trim();
  if (raw === undefined || raw === "") return DEFAULT_MAX_LIST_PAGES;
  const v = Number.parseInt(raw, 10);
  return v === 0 ? null : Number.isFinite(v) && v > 0 ? v : DEFAULT_MAX_LIST_PAGES;
}

/**
 * Historical migration: exhaustive listing per Created window unless you cap it explicitly.
 */
function envHistoricalMaxListPages(): number | null {
  const raw = process.env.AMAZON_ORDERS_HISTORICAL_MAX_LIST_PAGES?.trim();
  if (raw === undefined || raw === "") return null;
  const v = Number.parseInt(raw, 10);
  return v === 0 ? null : Number.isFinite(v) && v > 0 ? v : null;
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
  listingMode?: "lastUpdated" | "createdHistorical";
  /** Highest-level window / filter description for debugging */
  querySummary?: string;
  /** Incremental listing */
  lastUpdatedAfter?: string;
  historicalChunks?: number;

  ordersSeen: number;
  ordersUpserted: number;
  orderItemFetches: number;
  lineRowsWritten: number;
  listPages: number;
}

type ListExtras =
  | { lastUpdatedAfter: string; lastUpdatedBefore?: never; createdAfter?: never; createdBefore?: never }
  | { createdAfter: string; createdBefore: string; lastUpdatedAfter?: never; lastUpdatedBefore?: never };

async function collectOrdersForListExtras(
  client: OrdersApiClient,
  extras: ListExtras,
  maxListPages: number | null
): Promise<{ orders: Order[]; listPages: number; error?: string }> {
  const collected: Order[] = [];
  let listPages = 0;
  let nextToken: string | undefined;

  try {
    for (;;) {
      if (maxListPages !== null && listPages >= maxListPages) break;

      const { data } = await client.getOrders(
        {
          marketplaceIds: marketplaceIds(),
          ...(extras.lastUpdatedAfter
            ? { lastUpdatedAfter: extras.lastUpdatedAfter }
            : { createdAfter: extras.createdAfter!, createdBefore: extras.createdBefore! }),
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
      if (maxListPages !== null && listPages >= maxListPages) break;
    }
    return { orders: collected, listPages };
  } catch (e) {
    return {
      orders: collected,
      listPages,
      error: formatSpApiFailure(e),
    };
  }
}

async function applyOrderWrites(
  client: OrdersApiClient,
  collected: Order[],
  maxOrderItemFetches: number
): Promise<Pick<AmazonOrdersSyncResult, "error" | "ordersUpserted" | "orderItemFetches" | "lineRowsWritten">> {
  collected.sort((a, b) => new Date(b.LastUpdateDate).getTime() - new Date(a.LastUpdateDate).getTime());

  const detailTargets =
    maxOrderItemFetches <= 0
      ? new Set<string>()
      : new Set(collected.slice(0, maxOrderItemFetches).map((o) => o.AmazonOrderId));

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
        error: err instanceof Error ? err.message : "Database error during Amazon order upsert",
        ordersUpserted,
        orderItemFetches,
        lineRowsWritten,
      };
    }
  }

  return { ordersUpserted, orderItemFetches, lineRowsWritten };
}

/**
 * Incremental listing (cron / “Pull latest”): orders **updated** recently.
 * Historical totals in analytics only grow after you’ve imported older **created** windows.
 */
export async function syncAmazonOrdersFromSpApi(overrides?: {
  lookbackDays?: number;
  maxListPages?: number | null;
  maxOrderItemFetches?: number;
}): Promise<AmazonOrdersSyncResult> {
  if (!isAmazonSpApiConfigured()) {
    return {
      ok: false,
      listingMode: "lastUpdated",
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
  const maxListPages = overrides?.maxListPages ?? envIncrementalMaxListPages();
  const maxOrderItemFetches =
    overrides?.maxOrderItemFetches ?? envInt("AMAZON_ORDERS_SYNC_MAX_ORDER_ITEM_FETCHES", DEFAULT_MAX_ORDER_ITEM_FETCHES);

  const lastUpdatedAfter = new Date(Date.now() - lookbackDays * DAY_MS).toISOString();
  const client = createOrdersClient();

  const { orders: collected, listPages, error: listErr } = await collectOrdersForListExtras(
    client,
    { lastUpdatedAfter },
    maxListPages
  );

  if (listErr) {
    return {
      ok: false,
      listingMode: "lastUpdated",
      querySummary: `LastUpdatedAfter ≥ ${lastUpdatedAfter}`,
      lastUpdatedAfter,
      error: listErr,
      ordersSeen: collected.length,
      ordersUpserted: 0,
      orderItemFetches: 0,
      lineRowsWritten: 0,
      listPages,
    };
  }

  const writeResult = await applyOrderWrites(client, collected, maxOrderItemFetches);
  if (writeResult.error) {
    return {
      ok: false,
      listingMode: "lastUpdated",
      lastUpdatedAfter,
      ordersSeen: collected.length,
      listPages,
      ordersUpserted: writeResult.ordersUpserted,
      orderItemFetches: writeResult.orderItemFetches,
      lineRowsWritten: writeResult.lineRowsWritten,
      error: writeResult.error,
    };
  }

  return {
    ok: true,
    listingMode: "lastUpdated",
    querySummary: `LastUpdated ≥ ${lookbackDays}d`,
    lastUpdatedAfter,
    ordersSeen: collected.length,
    ordersUpserted: writeResult.ordersUpserted,
    orderItemFetches: writeResult.orderItemFetches,
    lineRowsWritten: writeResult.lineRowsWritten,
    listPages,
  };
}

/**
 * One-time-ish migration: pulls order **headers** for orders **created** in the last N days
 * by walking `CreatedAfter/CreatedBefore` windows and exhausting `NextToken` pages where possible.
 * SP-API (non JP/AU/SG) exposes ~2 years of orders — default `historicalDays` is 720.
 */
export async function syncAmazonOrdersHistoricalCreatedHeaders(overrides?: {
  historicalDays?: number;
  chunkDays?: number;
  /** `null` ⇒ follow full pagination per window */
  maxListPages?: number | null;
  /** Set 0 for headers-only (fast migration); recover lines via `syncAmazonMissingMarketplaceLines` later */
  maxOrderItemFetches?: number;
}): Promise<AmazonOrdersSyncResult> {
  if (!isAmazonSpApiConfigured()) {
    return {
      ok: false,
      listingMode: "createdHistorical",
      error:
        "Missing LWA credentials: set LWA_CLIENT_ID, LWA_CLIENT_SECRET, and LWA_REFRESH_TOKEN (see .env.example).",
      ordersSeen: 0,
      ordersUpserted: 0,
      orderItemFetches: 0,
      lineRowsWritten: 0,
      listPages: 0,
    };
  }

  const historicalDays =
    overrides?.historicalDays ?? envInt("AMAZON_ORDERS_HISTORICAL_CREATED_DAYS", DEFAULT_HISTORICAL_CREATED_DAYS_MAX);
  const chunkDays =
    overrides?.chunkDays ?? envHistoricalChunkDays(DEFAULT_HISTORICAL_CHUNK_DAYS);
  const maxListPages = overrides?.maxListPages ?? envHistoricalMaxListPages();
  const maxOrderItemFetches = overrides?.maxOrderItemFetches ?? envHistoricalMaxOrderItemFetches();

  const nowMinus2Min = Date.now() - TWO_MINUTES_MS;
  const cutoffMs = Math.max(0, nowMinus2Min - historicalDays * DAY_MS);

  const client = createOrdersClient();
  const merged = new Map<string, Order>();

  let listPagesSum = 0;
  let chunks = 0;

  if (chunkDays <= 0) {
    chunks = 1;
    const createdAfter = new Date(cutoffMs).toISOString();
    const createdBefore = new Date(nowMinus2Min).toISOString();
    const {
      orders: chunkOrders,
      listPages,
      error: listErr,
    } = await collectOrdersForListExtras(client, { createdAfter, createdBefore }, maxListPages);
    listPagesSum += listPages;
    if (listErr) {
      return {
        ok: false,
        listingMode: "createdHistorical",
        querySummary: `Created ${createdAfter} … ${createdBefore}`,
        historicalChunks: chunks,
        error: listErr,
        ordersSeen: chunkOrders.length,
        ordersUpserted: 0,
        orderItemFetches: 0,
        lineRowsWritten: 0,
        listPages: listPagesSum,
      };
    }
    for (const o of chunkOrders) merged.set(o.AmazonOrderId, o);
  } else {
    const chunkMs = chunkDays * DAY_MS;

    let windowStartMs = cutoffMs;

    while (windowStartMs < nowMinus2Min) {
      const windowEndMs = Math.min(nowMinus2Min, windowStartMs + chunkMs);
      const createdAfter = new Date(windowStartMs).toISOString();
      const createdBefore = new Date(windowEndMs).toISOString();
      chunks += 1;

      const {
        orders: chunkOrders,
        listPages,
        error: listErr,
      } = await collectOrdersForListExtras(client, { createdAfter, createdBefore }, maxListPages);

      listPagesSum += listPages;

      if (listErr) {
        return {
          ok: false,
          listingMode: "createdHistorical",
          querySummary: `Created chunk ${chunks} (${createdAfter} … ${createdBefore}); partial merge`,
          historicalChunks: chunks,
          error: listErr,
          ordersSeen: merged.size,
          ordersUpserted: 0,
          orderItemFetches: 0,
          lineRowsWritten: 0,
          listPages: listPagesSum,
        };
      }

      for (const o of chunkOrders) merged.set(o.AmazonOrderId, o);
      windowStartMs = windowEndMs;
      if (windowEndMs >= nowMinus2Min) break;
    }
  }

  const collected = [...merged.values()];

  const writeResult = await applyOrderWrites(client, collected, maxOrderItemFetches);
  if (writeResult.error) {
    return {
      ok: false,
      listingMode: "createdHistorical",
      historicalChunks: chunks || 1,
      ordersSeen: collected.length,
      listPages: listPagesSum,
      ordersUpserted: writeResult.ordersUpserted,
      orderItemFetches: writeResult.orderItemFetches,
      lineRowsWritten: writeResult.lineRowsWritten,
      error: writeResult.error,
    };
  }

  return {
    ok: true,
    listingMode: "createdHistorical",
    querySummary: `${historicalDays}d created-history · chunks=${chunks || 1}`,
    historicalChunks: chunks || 1,
    ordersSeen: collected.length,
    ordersUpserted: writeResult.ordersUpserted,
    orderItemFetches: writeResult.orderItemFetches,
    lineRowsWritten: writeResult.lineRowsWritten,
    listPages: listPagesSum,
  };
}

export interface AmazonMissingLinesResult {
  ok: boolean;
  error?: string;
  ordersExamined: number;
  ordersWithLinesFetched: number;
  lineRowsWritten: number;
}

/**
 * Runs `GetOrderItems` for marketplace orders that exist but have zero line rows
 * (e.g. after a headers-first historical import).
 */
export async function syncAmazonMissingMarketplaceLines(overrides?: { limit?: number }): Promise<AmazonMissingLinesResult> {
  if (!isAmazonSpApiConfigured()) {
    return {
      ok: false,
      error:
        "Missing LWA credentials: set LWA_CLIENT_ID, LWA_CLIENT_SECRET, and LWA_REFRESH_TOKEN (see .env.example).",
      ordersExamined: 0,
      ordersWithLinesFetched: 0,
      lineRowsWritten: 0,
    };
  }

  const limit =
    overrides?.limit ?? envInt("AMAZON_ORDERS_SYNC_MISSING_LINES_BATCH", DEFAULT_MAX_ORDER_ITEM_FETCHES);

  const client = createOrdersClient();

  const needing = await prisma.amazonMarketplaceOrder.findMany({
    where: { lines: { none: {} } },
    select: {
      id: true,
      amazonOrderId: true,
    },
    orderBy: { purchaseDate: "desc" },
    take: Math.max(1, limit),
  });

  let lineRowsWritten = 0;
  let ordersWithLinesFetched = 0;

  for (const row of needing) {
    let items: OrderItem[] = [];
    try {
      items = await fetchAllOrderItems(client, row.amazonOrderId);
      ordersWithLinesFetched += 1;
    } catch {
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.amazonMarketplaceOrderLine.deleteMany({ where: { amazonOrderDbId: row.id } });
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
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Database error importing Amazon lines",
        ordersExamined: needing.length,
        ordersWithLinesFetched,
        lineRowsWritten,
      };
    }
  }

  return {
    ok: true,
    ordersExamined: needing.length,
    ordersWithLinesFetched,
    lineRowsWritten,
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
