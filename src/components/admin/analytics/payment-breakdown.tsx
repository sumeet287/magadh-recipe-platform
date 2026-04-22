import { formatCurrency } from "@/lib/utils";
import type { PaymentMethodRow } from "@/lib/analytics";

interface Props {
  rows: PaymentMethodRow[];
}

const methodLabels: Record<string, string> = {
  RAZORPAY: "Razorpay (Cards/UPI/Net Banking)",
  COD: "Cash on Delivery",
  UPI: "UPI",
  STRIPE: "Stripe",
};

export function PaymentBreakdown({ rows }: Props) {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCount = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Payment method mix</h3>
        <p className="text-xs text-gray-500">Share of paid orders by method</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-600 py-6 text-center">No paid orders yet</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const pctOrders = totalCount > 0 ? (row.count / totalCount) * 100 : 0;
            const pctRevenue = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
            return (
              <div key={row.method} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-medium">
                    {methodLabels[row.method] ?? row.method}
                  </span>
                  <span className="text-gray-500 tabular-nums">
                    {row.count} orders · {formatCurrency(row.revenue)}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${pctRevenue}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 tabular-nums">
                  {pctOrders.toFixed(1)}% of orders · {pctRevenue.toFixed(1)}% of revenue
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
