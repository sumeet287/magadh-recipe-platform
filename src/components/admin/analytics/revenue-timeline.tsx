import { formatCurrency } from "@/lib/utils";

interface TimelineDatum {
  date: string;
  revenue: number;
  orders: number;
}

interface Props {
  data: TimelineDatum[];
  metric?: "revenue" | "orders";
}

function formatDateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** `h-40` (10rem); use px heights for bars — % height breaks inside flex (`items-end`) columns without an explicit chart column height */
const CHART_INNER_HEIGHT_PX = 160;

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
        <div className="flex gap-[2px] h-40 shrink-0" role="presentation">
          {data.map((d) => {
            const vRaw = metric === "revenue" ? d.revenue : d.orders;
            const v = Number.isFinite(vRaw) ? vRaw : 0;
            const barPx = Math.min(
              CHART_INNER_HEIGHT_PX,
              Math.max(v > 0 ? 3 : 0, (v / max) * CHART_INNER_HEIGHT_PX)
            );
            const title =
              metric === "revenue"
                ? `${formatDateLabel(d.date)} · ${formatCurrency(d.revenue)} · ${d.orders} orders`
                : `${formatDateLabel(d.date)} · ${d.orders} orders · ${formatCurrency(d.revenue)}`;
            return (
              <div
                key={d.date}
                title={title}
                className="flex-1 min-w-[3px] min-h-0 h-full flex flex-col justify-end overflow-hidden rounded-t-sm group relative"
              >
                <div
                  className="w-full shrink-0 rounded-t-sm bg-brand-600 group-hover:bg-brand-400 transition-colors"
                  style={{ height: `${barPx}px` }}
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
