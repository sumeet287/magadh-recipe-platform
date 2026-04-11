import { prisma } from "@/lib/prisma";
import { Image as ImageIcon } from "lucide-react";

export const metadata = { title: "Banners | Magadh Recipe Admin" };

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: [{ position: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Banners</h1>
          <p className="text-gray-400 text-sm mt-1">{banners.length} total banners</p>
        </div>
      </div>

      {banners.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
          <ImageIcon className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm">No banners created yet</p>
          <p className="text-gray-600 text-xs mt-1">Banners will appear on the storefront homepage</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-6 py-3 font-medium">Preview</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Position</th>
                <th className="px-6 py-3 font-medium">CTA</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {banners.map((b) => (
                <tr key={b.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-3">
                    <img src={b.imageUrl} alt={b.title} className="w-24 h-14 object-cover rounded-lg" />
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-white font-medium">{b.title}</p>
                    {b.subtitle && <p className="text-gray-500 text-xs mt-0.5">{b.subtitle}</p>}
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs uppercase">{b.position}</td>
                  <td className="px-6 py-3">
                    {b.ctaText ? (
                      <span className="text-brand-400 text-xs">{b.ctaText} → {b.ctaLink}</span>
                    ) : (
                      <span className="text-gray-600 text-xs">None</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.isActive ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">
                    {b.startDate ? b.startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Always"}
                    {b.endDate ? ` → ${b.endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : " → No end"}
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
