import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Package,
  Truck,
  User,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import { OrderActions } from "./order-actions";

function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "PENDING":
    case "FAILED":
      return "bg-gray-700 text-gray-300";
    case "CONFIRMED":
    case "PAID":
      return "bg-blue-900/50 text-blue-400";
    case "PROCESSING":
    case "PACKED":
      return "bg-yellow-900/50 text-yellow-400";
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return "bg-purple-900/50 text-purple-400";
    case "DELIVERED":
      return "bg-green-900/50 text-green-400";
    case "CANCELLED":
      return "bg-red-900/50 text-red-400";
    case "RETURN_REQUESTED":
    case "RETURNED":
      return "bg-orange-900/50 text-orange-400";
    case "REFUND_INITIATED":
    case "REFUNDED":
      return "bg-pink-900/50 text-pink-400";
    default:
      return "bg-gray-700 text-gray-300";
  }
}

function getPaymentStatusBadge(status: string): string {
  switch (status) {
    case "PAID":
    case "CAPTURED":
      return "bg-green-900/50 text-green-400";
    case "PENDING":
    case "AUTHORIZED":
      return "bg-yellow-900/50 text-yellow-400";
    case "FAILED":
      return "bg-red-900/50 text-red-400";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "bg-pink-900/50 text-pink-400";
    default:
      return "bg-gray-700 text-gray-300";
  }
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")
  ) {
    redirect("/login?callbackUrl=/admin");
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      items: true,
      shipping: true,
      payment: true,
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!order) notFound();

  const statusConfig =
    ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold text-white">
                {order.orderNumber}
              </h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusBadgeClasses(order.status)}`}
              >
                {statusConfig?.label ?? order.status}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Placed on {formatDate(order.createdAt)} &middot;{" "}
              {order.paymentMethod} &middot;{" "}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPaymentStatusBadge(order.paymentStatus)}`}
              >
                {order.paymentStatus}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <h2 className="text-white font-semibold text-sm">
                Items ({order.items.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs">
                    <th className="text-left px-5 py-3 font-medium">
                      Product
                    </th>
                    <th className="text-left px-5 py-3 font-medium">
                      Variant
                    </th>
                    <th className="text-center px-5 py-3 font-medium">Qty</th>
                    <th className="text-right px-5 py-3 font-medium">
                      Unit Price
                    </th>
                    <th className="text-right px-5 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {item.imageUrl && (
                            <Image
                              src={item.imageUrl}
                              alt={item.productName}
                              width={40}
                              height={40}
                              className="rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {item.productName}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              SKU: {item.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">
                        {item.variantName}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-center">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-5 py-3.5 text-white font-medium text-right">
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <h2 className="text-white font-semibold text-sm mb-4">
              Order Summary
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotalAmount)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>
                    Discount
                    {order.couponCode && (
                      <span className="ml-1.5 text-xs bg-green-900/30 text-green-500 px-1.5 py-0.5 rounded">
                        {order.couponCode}
                      </span>
                    )}
                  </span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {order.couponDiscount > 0 &&
                order.couponDiscount !== order.discountAmount && (
                  <div className="flex justify-between text-green-400">
                    <span>Coupon Discount</span>
                    <span>-{formatCurrency(order.couponDiscount)}</span>
                  </div>
                )}
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span>
                  {order.shippingAmount === 0
                    ? "Free"
                    : formatCurrency(order.shippingAmount)}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Tax (GST)</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="pt-2.5 border-t border-gray-800 flex justify-between text-white font-semibold">
                <span>Total</span>
                <span className="text-lg">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          {order.statusHistory.length > 0 && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-gray-400" />
                <h2 className="text-white font-semibold text-sm">
                  Status Timeline
                </h2>
              </div>
              <div className="relative pl-6">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-800" />
                <div className="space-y-4">
                  {order.statusHistory.map((entry, i) => {
                    const entryConfig =
                      ORDER_STATUS_CONFIG[
                        entry.status as keyof typeof ORDER_STATUS_CONFIG
                      ];
                    return (
                      <div key={entry.id} className="relative">
                        <div
                          className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 ${
                            i === 0
                              ? "bg-brand-500 border-brand-500"
                              : "bg-gray-900 border-gray-700"
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusBadgeClasses(entry.status)}`}
                            >
                              {entryConfig?.label ?? entry.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(entry.createdAt, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                          {entry.comment && (
                            <p className="text-sm text-gray-400 mt-1">
                              {entry.comment}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column — sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-gray-400" />
              <h2 className="text-white font-semibold text-sm">Customer</h2>
            </div>
            <div className="space-y-1.5">
              <p className="text-white text-sm font-medium">
                {order.user?.name ?? "—"}
              </p>
              <p className="text-gray-400 text-sm">{order.user?.email}</p>
            </div>
          </div>

          {/* Delivery Address */}
          {order.shipping && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <h2 className="text-white font-semibold text-sm">
                  Delivery Address
                </h2>
              </div>
              <div className="space-y-1 text-sm text-gray-400">
                <p className="text-white font-medium">
                  {order.shipping.recipientName}
                </p>
                <p>{order.shipping.phone}</p>
                <p>{order.shipping.addressLine1}</p>
                {order.shipping.addressLine2 && (
                  <p>{order.shipping.addressLine2}</p>
                )}
                <p>
                  {order.shipping.city}, {order.shipping.state}{" "}
                  {order.shipping.pincode}
                </p>
                <p>{order.shipping.country}</p>
              </div>
            </div>
          )}

          {/* Payment Info */}
          {order.payment && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <h2 className="text-white font-semibold text-sm">
                  Payment Details
                </h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Method</span>
                  <span className="text-white">{order.payment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPaymentStatusBadge(order.payment.status)}`}
                  >
                    {order.payment.status}
                  </span>
                </div>
                {order.payment.razorpayOrderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Razorpay Order</span>
                    <span className="text-gray-300 text-xs font-mono">
                      {order.payment.razorpayOrderId}
                    </span>
                  </div>
                )}
                {order.payment.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment ID</span>
                    <span className="text-gray-300 text-xs font-mono">
                      {order.payment.razorpayPaymentId}
                    </span>
                  </div>
                )}
                {order.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Paid at</span>
                    <span className="text-gray-300">
                      {formatDate(order.payment.paidAt, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tracking */}
          {order.shipping?.trackingNumber && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-gray-400" />
                <h2 className="text-white font-semibold text-sm">Tracking</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tracking #</span>
                  <span className="text-white font-mono text-xs">
                    {order.shipping.trackingNumber}
                  </span>
                </div>
                {order.shipping.courier && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Courier</span>
                    <span className="text-white">
                      {order.shipping.courier}
                    </span>
                  </div>
                )}
                {order.shipping.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. Delivery</span>
                    <span className="text-white">
                      {formatDate(order.shipping.estimatedDelivery)}
                    </span>
                  </div>
                )}
                {order.shipping.deliveredAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Delivered</span>
                    <span className="text-green-400">
                      <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                      {formatDate(order.shipping.deliveredAt, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                )}
                {order.shipping.trackingUrl && (
                  <a
                    href={order.shipping.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Track Shipment
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-white font-semibold text-sm mb-2">
                Order Notes
              </h2>
              <p className="text-sm text-gray-400">{order.notes}</p>
            </div>
          )}

          {/* Actions */}
          <OrderActions orderId={order.id} currentStatus={order.status} />
        </div>
      </div>
    </div>
  );
}
