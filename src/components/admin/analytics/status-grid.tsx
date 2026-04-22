import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import type { StatusBreakdownRow } from "@/lib/analytics";

interface Props {
  title: string;
  rows: StatusBreakdownRow[];
  totalCount: number;
}

export function StatusGrid({ title, rows, totalCount }: Props) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-gray-500">
            {totalCount.toLocaleString()} {totalCount === 1 ? "order" : "orders"} total
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-600 py-6 text-center">No orders in this period</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {rows.map((row) => {
            const config = ORDER_STATUS_CONFIG[row.status];
            const pct = totalCount > 0 ? (row.count / totalCount) * 100 : 0;
            return (
              <div
                key={row.status}
                className="bg-gray-800/60 border border-gray-800 rounded-xl p-3"
              >
                <span
                  className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    config?.color ?? "text-gray-400 bg-gray-700/40"
                  }`}
                >
                  {config?.label ?? row.status}
                </span>
                <p className="text-xl font-bold text-white mt-2 tabular-nums">
                  {row.count.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-500 tabular-nums">
                  {pct.toFixed(1)}% · {formatCurrency(row.revenue)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
