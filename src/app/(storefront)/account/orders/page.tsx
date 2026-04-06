import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Package } from "lucide-react";

export const metadata = { title: "My Orders | Magadh Recipe" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: { select: { name: true, images: { where: { isPrimary: true }, take: 1 } } } },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
        <h1 className="font-serif text-xl font-bold text-earth-dark mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No orders yet</p>
            <p className="text-sm text-gray-400 mt-1">Start shopping to see your orders here.</p>
            <Link href="/products" className="mt-4 inline-block text-sm text-brand-600 font-medium hover:text-brand-700">
              Browse Products →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.status];
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="block border border-gray-100 rounded-2xl p-5 hover:border-brand-200 hover:bg-brand-50/30 transition-all group"
                >
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-earth-dark text-sm">{order.orderNumber}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusConfig?.color ?? ""}`}
                        >
                          {statusConfig?.label ?? order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-earth-dark">{formatCurrency(order.totalAmount)}</p>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
                    </div>
                  </div>
                  {/* Preview images */}
                  <div className="flex gap-2 mt-3">
                    {order.items.slice(0, 3).map((item) => {
                      const img = item.product.images[0];
                      return img ? (
                        <img
                          key={item.id}
                          src={img.url}
                          alt={item.product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-100"
                        />
                      ) : null;
                    })}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
