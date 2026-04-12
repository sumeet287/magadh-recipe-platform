import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";

export const metadata = { title: "Order Details | Magadh Recipe" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect(`/login?callbackUrl=/account/orders/${id}`);

  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: {
        include: {
          product: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
          variant: { select: { name: true } },
        },
      },
      shipping: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      payment: true,
    },
  });

  if (!order) notFound();

  const statusConfig = ORDER_STATUS_CONFIG[order.status];

  const trackingSteps = [
    { key: "CONFIRMED", label: "Order Confirmed", icon: CheckCircle },
    { key: "PROCESSING", label: "Processing", icon: Clock },
    { key: "SHIPPED", label: "Shipped", icon: Truck },
    { key: "DELIVERED", label: "Delivered", icon: Package },
  ];

  const statusOrder = Object.keys(ORDER_STATUS_CONFIG);
  const currentStatusIdx = statusOrder.indexOf(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-xl font-bold text-earth-dark">
              Order #{order.orderNumber}
            </h1>
            <p className="text-sm text-gray-400 mt-1">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <Badge
            variant="outline"
            className={`text-sm px-3 py-1 ${statusConfig?.color ?? ""}`}
          >
            {statusConfig?.label ?? order.status}
          </Badge>
        </div>

        {/* Tracking bar */}
        <div className="mt-6 relative">
          <div className="flex items-center justify-between relative">
            {trackingSteps.map((step, i) => {
              const stepStatusIdx = statusOrder.indexOf(step.key);
              const isCompleted = stepStatusIdx <= currentStatusIdx;
              const isCurrent = step.key === order.status;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all
                      ${isCompleted ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-400"}
                      ${isCurrent ? "ring-4 ring-brand-200" : ""}
                    `}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className={`text-xs text-center ${isCompleted ? "text-earth-dark font-medium" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                  {/* Connector */}
                  {i < trackingSteps.length - 1 && (
                    <div
                      className={`absolute top-4 h-0.5 transition-all`}
                      style={{
                        left: `${(i + 0.5) * (100 / trackingSteps.length)}%`,
                        width: `${100 / trackingSteps.length}%`,
                        backgroundColor: stepStatusIdx < currentStatusIdx ? "#f97316" : "#e5e7eb",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {order.shipping?.trackingNumber && (
          <div className="mt-5 p-4 bg-brand-50 rounded-xl border border-brand-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-medium text-earth-dark">
                  {order.shipping.courier ? `Shipped via ${order.shipping.courier}` : "Shipment Details"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  AWB: <strong className="text-earth-dark font-mono">{order.shipping.trackingNumber}</strong>
                </p>
              </div>
              {order.shipping.trackingUrl && (
                <a
                  href={order.shipping.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Track Package
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-semibold text-earth-dark mb-4">Items Ordered</h2>
        <div className="space-y-4">
          {order.items.map((item) => {
            const img = item.product.images[0];
            return (
              <div key={item.id} className="flex gap-4">
                {img ? (
                  <img
                    src={img.url}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-earth-dark truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.variant?.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm text-earth-dark">{formatCurrency(item.totalPrice)}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice)} each</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Price Summary */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-semibold text-earth-dark mb-4">Price Summary</h2>
          <div className="space-y-2 text-sm">
            {[
              { label: "Subtotal", value: order.subtotalAmount },
              { label: "Discount", value: -order.discountAmount },
              { label: "Shipping", value: order.shippingAmount },
              { label: "GST (12% incl.)", value: order.taxAmount },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-600">{label}</span>
                <span className={value < 0 ? "text-green-600" : "text-earth-dark"}>
                  {value < 0 ? `− ${formatCurrency(-value)}` : formatCurrency(value)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {order.shipping && (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="font-semibold text-earth-dark mb-4">Delivery Address</h2>
            <div className="text-sm text-gray-600 space-y-1 leading-relaxed">
              <p className="font-medium text-earth-dark">{order.shipping.recipientName}</p>
              <p>{order.shipping.addressLine1}</p>
              {order.shipping.addressLine2 && <p>{order.shipping.addressLine2}</p>}
              <p>{order.shipping.city}, {order.shipping.state} – {order.shipping.pincode}</p>
              <p>Phone: {order.shipping.phone}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
