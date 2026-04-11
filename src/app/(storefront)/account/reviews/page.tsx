import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, Clock, CheckCircle, XCircle, Package } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Reviews | Magadh Recipe" };

const STATUS_MAP: Record<string, { label: string; color: string; Icon: typeof CheckCircle }> = {
  PENDING: { label: "Pending", color: "text-yellow-600 bg-yellow-50", Icon: Clock },
  APPROVED: { label: "Approved", color: "text-green-600 bg-green-50", Icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "text-red-600 bg-red-50", Icon: XCircle },
  SPAM: { label: "Hidden", color: "text-gray-500 bg-gray-100", Icon: XCircle },
};

export default async function AccountReviewsPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/account/reviews");

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    include: { product: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-earth-dark mb-1">My Reviews</h1>
      <p className="text-sm text-gray-500 mb-6">{reviews.length} review{reviews.length !== 1 ? "s" : ""} submitted</p>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-1">No reviews yet</h3>
          <p className="text-sm text-gray-500 mb-4">After purchasing and trying our products, share your experience!</p>
          <Link href="/products" className="text-sm text-brand-600 font-medium hover:text-brand-700">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const statusInfo = STATUS_MAP[review.status] ?? STATUS_MAP.PENDING;
            const StatusIcon = statusInfo.Icon;
            return (
              <div key={review.id} className="bg-white rounded-2xl shadow-card p-5">
                <div className="flex items-start gap-4">
                  {review.product.images[0] ? (
                    <img
                      src={review.product.images[0].url}
                      alt={review.product.name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <Link href={`/products/${review.product.slug}`} className="font-semibold text-earth-dark hover:text-brand-600 truncate">
                        {review.product.name}
                      </Link>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">
                        {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {review.title && <p className="text-sm font-medium text-gray-800 mb-1">{review.title}</p>}
                    <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
                    {review.reply && (
                      <div className="mt-3 p-3 bg-brand-50 rounded-lg border border-brand-100">
                        <p className="text-xs font-semibold text-brand-700 mb-1">Reply from Magadh Recipe</p>
                        <p className="text-xs text-gray-600">{review.reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
