import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CheckoutSuccessPurchase,
  type PurchaseTelemetryOrder,
} from "@/components/analytics/checkout-success-purchase";

interface Props {
  searchParams: Promise<{ orderId?: string }>;
}

export const metadata = { title: "Order Confirmed! | Magadh Recipe" };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId } = await searchParams;
  const session = await auth();
  if (!session) redirect("/login");

  const order = orderId
    ? await prisma.order.findFirst({
        where: { id: orderId, userId: session.user.id },
        select: {
          orderNumber: true,
          couponCode: true,
          shippingAmount: true,
          taxAmount: true,
          totalAmount: true,
          items: {
            select: {
              id: true,
              productId: true,
              productName: true,
              variantName: true,
              sku: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
          shipping: true,
          id: true,
        },
      })
    : null;

  let purchaseTelemetry: PurchaseTelemetryOrder | null = null;
  if (order) {
    purchaseTelemetry = {
      orderNumber: order.orderNumber,
      couponCode: order.couponCode,
      shippingAmount: order.shippingAmount,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      items: order.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        variantName: it.variantName,
        sku: it.sku,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
      })),
    };
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-premium p-8 md:p-12 max-w-lg w-full text-center">
        {purchaseTelemetry ? <CheckoutSuccessPurchase order={purchaseTelemetry} /> : null}
        {/* Animated checkmark */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="font-serif text-2xl font-bold text-earth-dark mb-2">
          Order Confirmed! 🎉
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Thank you for your order! We&apos;ve received your order and will start processing it right away.
          You&apos;ll receive a confirmation email shortly.
        </p>

        {order && (
          <div className="bg-cream-100 rounded-2xl p-5 text-left mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-500" />
                <p className="font-semibold text-earth-dark text-sm">Order #{order.orderNumber}</p>
              </div>
              <p className="font-bold text-earth-dark">{formatCurrency(order.totalAmount)}</p>
            </div>
            <div className="space-y-1">
              {order.items.slice(0, 3).map((item) => (
                <p key={item.id} className="text-xs text-gray-600">
                  {item.productName} ({item.variantName}) × {item.quantity}
                </p>
              ))}
              {order.items.length > 3 && (
                <p className="text-xs text-gray-400">+{order.items.length - 3} more items</p>
              )}
            </div>
            {order.shipping && (
              <p className="text-xs text-gray-500">
                Delivering to: {order.shipping.city}, {order.shipping.state} – {order.shipping.pincode}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {order && (
            <Link href={`/account/orders/${order.id}`} className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                Track Order
              </Button>
            </Link>
          )}
          <Link href="/products" className="flex-1">
            <Button variant="premium" size="lg" className="w-full gap-2">
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
