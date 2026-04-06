import { TRUST_BADGES } from "@/lib/constants";

export function TrustBadges() {
  return (
    <section className="py-0 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-gray-100 border-y border-gray-100">
          {TRUST_BADGES.map((badge, idx) => (
            <div
              key={badge.title}
              className="flex flex-col items-center text-center gap-3 px-6 py-8 group hover:bg-brand-50/50 transition-colors duration-200"
            >
              <div className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
                {badge.icon}
              </div>
              <div>
                <p className="font-bold text-sm text-[#1a0e07] leading-tight">{badge.title}</p>
                <p className="text-[11px] text-gray-400 leading-snug mt-1 hidden sm:block">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
