"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { ga4PurchasePayloadFromOrder, pushShopEvent } from "@/lib/analytics/shop-events";

export type PurchaseTelemetryOrder = {
  orderNumber: string;
  couponCode: string | null;
  shippingAmount: number;
  taxAmount: number;
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
};

interface Props {
  order: PurchaseTelemetryOrder;
}

/** One shot `purchase` per confirmed order landing (logged-in checkout success page). */
export function CheckoutSuccessPurchase({ order }: Props) {
  const { data: session } = useSession();
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const ecommerce = ga4PurchasePayloadFromOrder({
      orderNumber: order.orderNumber,
      couponCode: order.couponCode,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      items: order.items,
    });
    pushShopEvent(
      {
        event: "purchase",
        ecommerce,
      },
      session ?? null
    );
  }, [
    order.couponCode,
    order.orderNumber,
    order.shippingAmount,
    order.taxAmount,
    order.totalAmount,
    order.items,
    session,
  ]);

  return null;
}
