import { prisma } from "@/lib/prisma";
import { Settings } from "lucide-react";

export const metadata = { title: "Settings | Magadh Recipe Admin" };

export default async function AdminSettingsPage() {
  const settings = await prisma.setting.findMany({
    orderBy: [{ group: "asc" }, { key: "asc" }],
  });

  const grouped = settings.reduce<Record<string, typeof settings>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  const groupLabels: Record<string, string> = {
    general: "General",
    contact: "Contact",
    shipping: "Shipping",
    payment: "Payment",
    seo: "SEO",
    social: "Social Media",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Site configuration & preferences</p>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
          <Settings className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm">No settings configured</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-semibold text-white capitalize">{groupLabels[group] ?? group}</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {items.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors">
                    <div>
                      <p className="text-white text-sm font-medium">{s.key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</p>
                      <p className="text-gray-500 text-xs font-mono mt-0.5">{s.key}</p>
                    </div>
                    <div className="text-right max-w-[400px]">
                      <p className="text-gray-300 text-sm truncate">{s.value || "—"}</p>
                      <p className="text-gray-600 text-[10px] mt-0.5">type: {s.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
