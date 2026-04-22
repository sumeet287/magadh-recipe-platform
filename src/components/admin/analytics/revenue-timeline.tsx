import { formatCurrency } from "@/lib/utils";
import type { DailyPoint } from "@/lib/analytics";

interface Props {
  data: DailyPoint[];
  metric?: "revenue" | "orders";
}

function formatDateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function RevenueTimeline({ data, metric = "revenue" }: Props) {
  const values = data.map((d) => (metric === "revenue" ? d.revenue : d.orders));
  const max = Math.max(1, ...values);
  const total = values.reduce((s, v) => s + v, 0);
  const avg = data.length > 0 ? total / data.length : 0;

  // Sample labels: show at most 8 evenly spaced labels so the x-axis doesn't get crowded.
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-white">
            {metric === "revenue" ? "Revenue timeline" : "Orders timeline"}
          </h3>
          <p className="text-xs text-gray-500">
            {metric === "revenue"
              ? `Total ${formatCurrency(total)} · Avg ${formatCurrency(avg)}/day`
              : `Total ${total.toLocaleString()} orders · Avg ${avg.toFixed(1)}/day`}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-end gap-[2px] h-40">
          {data.map((d, i) => {
            const v = metric === "revenue" ? d.revenue : d.orders;
            const pct = (v / max) * 100;
            const title =
              metric === "revenue"
                ? `${formatDateLabel(d.date)} · ${formatCurrency(d.revenue)} · ${d.orders} orders`
                : `${formatDateLabel(d.date)} · ${d.orders} orders · ${formatCurrency(d.revenue)}`;
            return (
              <div
                key={d.date}
                title={title}
                className="flex-1 min-w-[3px] group relative"
              >
                <div
                  className="w-full rounded-t-sm bg-brand-600 group-hover:bg-brand-400 transition-colors"
                  style={{ height: `${Math.max(pct, v > 0 ? 2 : 0)}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between gap-1 mt-2">
          {data.map((d, i) => (
            <div
              key={d.date}
              className="text-[9px] text-gray-600 flex-1 text-center truncate"
            >
              {i % labelEvery === 0 ? formatDateLabel(d.date) : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
