import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export interface TopListItem {
  key: string;
  label: string;
  sublabel?: string;
  href?: string;
  value: number; // numeric for bar rendering
  valueLabel: string; // displayed
  secondaryLabel?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  items: TopListItem[];
  emptyMessage?: string;
  accentClass?: string; // tailwind bg class for bars
}

export function TopList({
  title,
  subtitle,
  items,
  emptyMessage = "No data for this period",
  accentClass = "bg-brand-600/60",
}: Props) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-gray-600 py-6 text-center">{emptyMessage}</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, i) => {
            const pct = (item.value / max) * 100;
            const Row = (
              <div className="relative overflow-hidden rounded-lg group hover:bg-gray-800/50 transition-colors">
                <div
                  className={`absolute inset-y-0 left-0 ${accentClass} opacity-40 group-hover:opacity-60 transition-opacity`}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between px-3 py-2 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] text-gray-500 font-mono w-4 tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{item.label}</p>
                      {item.sublabel && (
                        <p className="text-[10px] text-gray-500 truncate">{item.sublabel}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-white font-medium tabular-nums">{item.valueLabel}</p>
                    {item.secondaryLabel && (
                      <p className="text-[10px] text-gray-500 tabular-nums">{item.secondaryLabel}</p>
                    )}
                  </div>
                </div>
              </div>
            );
            return item.href ? (
              <Link key={item.key} href={item.href}>
                {Row}
              </Link>
            ) : (
              <div key={item.key}>{Row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function formatGeoItem(row: { name: string; state?: string; orders: number; revenue: number }): TopListItem {
  return {
    key: `${row.name}-${row.state ?? ""}`,
    label: row.name,
    sublabel: row.state || undefined,
    value: row.orders,
    valueLabel: `${row.orders} ${row.orders === 1 ? "order" : "orders"}`,
    secondaryLabel: formatCurrency(row.revenue),
  };
}
