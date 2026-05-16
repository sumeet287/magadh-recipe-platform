"use client";

import { sendGTMEvent } from "@next/third-parties/google";
import type { Session } from "next-auth";
import type { CartItemDisplay, ProductCardData } from "@/types";

const CURRENCY = "INR";

export type Ga4EcommerceItem = {
  item_id: string;
  item_name: string;
  item_variant?: string;
  item_category?: string;
  coupon?: string;
  currency?: string;
  discount?: number;
  index?: number;
  item_list_id?: string;
  item_list_name?: string;
  price?: number;
  quantity?: number;
};

export function shopUserDims(session: Session | null) {
  const id = session?.user?.id;
  return {
    mr_logged_in: Boolean(id),
    ...(id ? { mr_user_id: id } : {}),
  };
}

function roundMoney(n: number) {
  return Math.round(n * 100) / 100;
}

function defaultVariantIdx(product: { variants: { isDefault?: boolean; stock: number }[] }) {
  const preferred = product.variants.findIndex((v) => v.isDefault && v.stock > 0);
  if (preferred >= 0) return preferred;
  const ins = product.variants.findIndex((v) => v.stock > 0);
  return ins >= 0 ? ins : 0;
}

export function ga4ProductLineFromDetail(input: {
  productId: string;
  productName: string;
  categoryName?: string | null;
  variantName: string;
  unitPrice: number;
  quantity: number;
  mrp?: number;
  listCtx?: Pick<Ga4EcommerceItem, "item_list_id" | "item_list_name" | "index">;
}): Ga4EcommerceItem {
  const v = Math.max(0, (input.mrp ?? input.unitPrice) - input.unitPrice) * input.quantity;
  const { listCtx } = input;
  return {
    item_id: input.productId,
    item_name: input.productName,
    item_variant: input.variantName,
    ...(input.categoryName ? { item_category: input.categoryName } : {}),
    price: roundMoney(input.unitPrice),
    quantity: input.quantity,
    currency: CURRENCY,
    ...(v > 0 ? { discount: roundMoney(v) } : {}),
    ...(listCtx?.item_list_id ? { item_list_id: listCtx.item_list_id } : {}),
    ...(listCtx?.item_list_name ? { item_list_name: listCtx.item_list_name } : {}),
    ...(typeof listCtx?.index === "number" ? { index: listCtx.index } : {}),
  };
}

/** GA4 ecommerce `items[]` lines from storefront cart rows. */
export function cartLinesToGa4Items(
  lines: CartItemDisplay[],
  options?: { listId?: string; listName?: string }
): Ga4EcommerceItem[] {
  return lines.map((item, idx) =>
    ga4ProductLineFromDetail({
      productId: item.productId,
      productName: item.product.name,
      categoryName: undefined,
      variantName: item.variant.name,
      unitPrice: item.variant.price,
      quantity: item.quantity,
      mrp: item.variant.mrp,
      listCtx: options
        ? {
            item_list_id: options.listId,
            item_list_name: options.listName,
            index: idx + 1,
          }
        : { index: idx + 1 },
    })
  );
}

function cardLine(
  product: ProductCardData,
  variantIndex: number,
  quantity: number,
  ctx?: Pick<Ga4EcommerceItem, "item_list_id" | "item_list_name" | "index">
) {
  const v = product.variants[variantIndex];
  if (!v) return null;
  const savings = Math.max(0, v.mrp - v.price) * quantity;
  const line: Ga4EcommerceItem = {
    item_id: product.id,
    item_name: product.name,
    item_variant: v.name,
    item_category: product.category.name,
    price: roundMoney(v.price),
    quantity,
    currency: CURRENCY,
    ...(savings > 0 ? { discount: roundMoney(savings) } : {}),
    ...(ctx?.item_list_id ? { item_list_id: ctx.item_list_id } : {}),
    ...(ctx?.item_list_name ? { item_list_name: ctx.item_list_name } : {}),
    ...(typeof ctx?.index === "number" ? { index: ctx.index } : {}),
  };
  return line;
}

export function ga4ListingItemsFromCards(
  products: ProductCardData[],
  ctx: { listId: string; listName: string }
): Ga4EcommerceItem[] {
  const out: Ga4EcommerceItem[] = [];
  products.forEach((p, idx) => {
    const variantIdx = defaultVariantIdx(p);
    const line = cardLine(p, variantIdx, 1, {
      item_list_id: ctx.listId,
      item_list_name: ctx.listName,
      index: idx + 1,
    });
    if (line) out.push(line);
  });
  return out;
}

export function ga4ItemFromDetailAdd(
  product: {
    id: string;
    name: string;
    category: { name: string };
  },
  variant: {
    id: string;
    name: string;
    price: number;
    mrp: number;
    stock: number;
  },
  quantity: number,
  listCtx?: Pick<Ga4EcommerceItem, "item_list_id" | "item_list_name">
): Ga4EcommerceItem | null {
  if (variant.stock <= 0) return null;
  const savings = Math.max(0, variant.mrp - variant.price) * quantity;
  return {
    item_id: product.id,
    item_name: product.name,
    item_variant: variant.name,
    item_category: product.category.name,
    price: roundMoney(variant.price),
    quantity,
    currency: CURRENCY,
    ...(savings > 0 ? { discount: roundMoney(savings) } : {}),
    ...(listCtx?.item_list_id ? { item_list_id: listCtx.item_list_id } : {}),
    ...(listCtx?.item_list_name ? { item_list_name: listCtx.item_list_name } : {}),
  };
}

export function ga4ItemFromCardAdd(product: ProductCardData, variantIndex: number, quantity = 1) {
  return cardLine(product, variantIndex, quantity);
}

/** GA4 ecommerce object for carts & checkout summaries. */
export function ga4CartPayload(lines: CartItemDisplay[], value: number, couponCode?: string | null) {
  return {
    currency: CURRENCY,
    value: roundMoney(value),
    ...(couponCode ? { coupon: couponCode } : {}),
    items: cartLinesToGa4Items(lines),
  };
}

/** GA4-oriented purchase payload built from persisted order snapshots. */
export function ga4PurchasePayloadFromOrder(input: {
  orderNumber: string;
  couponCode?: string | null;
  shippingAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  items: {
    productId: string;
    productName: string;
    variantName: string;
    sku?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}) {
  const items = input.items.map((row, idx) =>
    ga4ProductLineFromDetail({
      productId: row.productId,
      productName: row.productName,
      variantName: row.variantName,
      unitPrice: row.unitPrice,
      quantity: row.quantity,
      listCtx: { index: idx + 1 },
    })
  );
  return {
    transaction_id: input.orderNumber,
    currency: CURRENCY,
    value: roundMoney(input.totalAmount),
    tax: typeof input.taxAmount === "number" ? roundMoney(input.taxAmount) : undefined,
    shipping:
      typeof input.shippingAmount === "number" ? roundMoney(input.shippingAmount) : undefined,
    coupon: input.couponCode || undefined,
    items,
  };
}

export function pushShopEvent(eventPayload: Record<string, unknown>, session: Session | null) {
  if (typeof window === "undefined") return;
  sendGTMEvent({
    ...shopUserDims(session),
    ...eventPayload,
  });
}
