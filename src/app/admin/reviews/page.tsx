import { prisma } from "@/lib/prisma";
import { Star, MessageSquare } from "lucide-react";

export const metadata = { title: "Reviews | Magadh Recipe Admin" };

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
  });

  const pending = reviews.filter((r) => r.status === "PENDING").length;
  const approved = reviews.filter((r) => r.status === "APPROVED").length;
  const rejected = reviews.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Reviews</h1>
        <p className="text-gray-400 text-sm mt-1">{reviews.length} total reviews</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-2xl font-bold text-amber-400">{pending}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Review</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-2xl font-bold text-green-400">{approved}</p>
          <p className="text-xs text-gray-500 mt-1">Approved</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <p className="text-2xl font-bold text-red-400">{rejected}</p>
          <p className="text-xs text-gray-500 mt-1">Rejected</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm">No reviews yet</p>
          <p className="text-gray-600 text-xs mt-1">Customer reviews will appear here for moderation</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Rating</th>
                <th className="px-6 py-3 font-medium">Review</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <p className="text-white text-xs font-medium">{r.user.name ?? "Anonymous"}</p>
                    <p className="text-gray-500 text-[10px]">{r.user.email}</p>
                  </td>
                  <td className="px-6 py-3.5 text-gray-300 text-xs max-w-[180px] truncate">{r.product.name}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-700"}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    {r.title && <p className="text-white text-xs font-medium">{r.title}</p>}
                    <p className="text-gray-400 text-xs line-clamp-2 max-w-[250px]">{r.body}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === "APPROVED" ? "bg-green-900/40 text-green-400" :
                      r.status === "REJECTED" ? "bg-red-900/40 text-red-400" :
                      "bg-amber-900/40 text-amber-400"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-gray-400 text-xs">
                    {r.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
