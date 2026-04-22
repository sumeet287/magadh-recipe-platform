import Link from "next/link";
import { IndianRupee, ShoppingBag, Users, UserPlus, RotateCcw, XCircle, BarChart3, Repeat, TrendingUp } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import {
  resolveDateRange,
  previousPeriod,
  getHeadlineMetrics,
  getDailyTimeline,
  getStatusBreakdown,
  getPaymentMethodBreakdown,
  getCityBreakdown,
  getStateBreakdown,
  getTopProducts,
  getRecentOrdersInRange,
} from "@/lib/analytics";

import { AnalyticsFilterBar } from "@/components/admin/analytics/filter-bar";
import { MetricCard } from "@/components/admin/analytics/metric-card";
import { RevenueTimeline } from "@/components/admin/analytics/revenue-timeline";
import { TopList, formatGeoItem } from "@/components/admin/analytics/top-list";
import { StatusGrid } from "@/components/admin/analytics/status-grid";
import { PaymentBreakdown } from "@/components/admin/analytics/payment-breakdown";

export const metadata = { title: "Analytics | Magadh Recipe Admin" };
// Always fetch fresh numbers when the page loads.
export const dynamic = "force-dynamic";

interface SearchParams {
  preset?: string;
  from?: string;
  to?: string;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const range = resolveDateRange({
    preset: params.preset,
    from: params.from,
    to: params.to,
  });
  const prev = previousPeriod(range);

  const [
    headline,
    prevHeadline,
    timeline,
    statusRows,
    paymentRows,
    cityRows,
    stateRows,
    topProducts,
    recentOrders,
  ] = await Promise.all([
    getHeadlineMetrics(range),
    getHeadlineMetrics(prev),
    getDailyTimeline(range),
    getStatusBreakdown(range),
    getPaymentMethodBreakdown(range),
    getCityBreakdown(range, 12),
    getStateBreakdown(range, 10),
    getTopProducts(range, 10),
    getRecentOrdersInRange(range, 10),
  ]);

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Sales, customers, returns, geography — all the numbers in one place.
          </p>
        </div>
      </div>

      <AnalyticsFilterBar
        activePreset={range.preset}
        from={range.preset === "custom" ? range.from.toISOString() : undefined}
        to={range.preset === "custom" ? range.to.toISOString() : undefined}
        rangeLabel={range.label}
      />

      {/* Headline metrics row 1 — money */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Net revenue"
          value={formatCurrency(headline.netRevenue)}
          sub={`Gross ${formatCurrency(headline.grossRevenue)} · Refunds ${formatCurrency(headline.refundAmount)}`}
          previousValue={prevHeadline.netRevenue}
          currentValue={headline.netRevenue}
          icon={IndianRupee}
          tone="success"
        />
        <MetricCard
          label="Paid orders"
          value={headline.paidOrders.toLocaleString()}
          sub={`${headline.totalOrders.toLocaleString()} placed total`}
          previousValue={prevHeadline.paidOrders}
          currentValue={headline.paidOrders}
          icon={ShoppingBag}
          tone="info"
        />
        <MetricCard
          label="Average order value"
          value={formatCurrency(headline.avgOrderValue)}
          sub={`vs ${formatCurrency(prevHeadline.avgOrderValue)} previous`}
          previousValue={prevHeadline.avgOrderValue}
          currentValue={headline.avgOrderValue}
          icon={TrendingUp}
          tone="warning"
        />
        <MetricCard
          label="Return rate"
          value={`${headline.returnRate.toFixed(1)}%`}
          sub={`${headline.returnedOrders} returned / ${headline.paidOrders} paid`}
          previousValue={prevHeadline.returnRate}
          currentValue={headline.returnRate}
          inverseTrend
          icon={RotateCcw}
          tone="danger"
        />
      </div>

      {/* Headline metrics row 2 — customers & quality */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Unique customers"
          value={headline.uniqueCustomers.toLocaleString()}
          sub="Placed a paid order in period"
          previousValue={prevHeadline.uniqueCustomers}
          currentValue={headline.uniqueCustomers}
          icon={Users}
          tone="info"
        />
        <MetricCard
          label="New customers"
          value={headline.newCustomers.toLocaleString()}
          sub="First-time buyers in period"
          previousValue={prevHeadline.newCustomers}
          currentValue={headline.newCustomers}
          icon={UserPlus}
          tone="success"
        />
        <MetricCard
          label="Repeat customers"
          value={headline.repeatCustomers.toLocaleString()}
          sub={`${headline.repeatRate.toFixed(1)}% repeat rate`}
          previousValue={prevHeadline.repeatCustomers}
          currentValue={headline.repeatCustomers}
          icon={Repeat}
          tone="warning"
        />
        <MetricCard
          label="Cancel rate"
          value={`${headline.cancelRate.toFixed(1)}%`}
          sub={`${headline.cancelledOrders} cancelled / ${headline.totalOrders} placed`}
          previousValue={prevHeadline.cancelRate}
          currentValue={headline.cancelRate}
          inverseTrend
          icon={XCircle}
          tone="danger"
        />
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueTimeline data={timeline} metric="revenue" />
        </div>
        <RevenueTimeline data={timeline} metric="orders" />
      </div>

      {/* Status & payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <StatusGrid title="Order status breakdown" rows={statusRows} totalCount={headline.totalOrders} />
        </div>
        <PaymentBreakdown rows={paymentRows} />
      </div>

      {/* Geography */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopList
          title="Top cities"
          subtitle="Paid orders shipped to"
          items={cityRows.map(formatGeoItem)}
          accentClass="bg-brand-600/50"
        />
        <TopList
          title="Top states"
          subtitle="Paid orders shipped to"
          items={stateRows.map(formatGeoItem)}
          accentClass="bg-blue-600/50"
        />
      </div>

      {/* Products */}
      <TopList
        title="Top-selling products"
        subtitle="By revenue in this period"
        items={topProducts.map((p) => ({
          key: p.productId,
          label: p.name,
          sublabel: `${p.quantity} units`,
          href: p.slug ? `/products/${p.slug}` : undefined,
          value: p.revenue,
          valueLabel: formatCurrency(p.revenue),
          secondaryLabel: `${p.quantity} sold`,
        }))}
        accentClass="bg-green-600/50"
      />

      {/* Recent orders */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent orders in period</h3>
            <p className="text-xs text-gray-500">Most recent first</p>
          </div>
          <Link href="/admin/orders" className="text-xs text-brand-400 hover:text-brand-300">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-600 py-10 text-center">No orders in this period</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {recentOrders.map((order) => {
              const config = ORDER_STATUS_CONFIG[order.status];
              const location = order.shipping
                ? `${order.shipping.city}, ${order.shipping.state}`
                : "—";
              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/40 transition-colors gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.user?.name ?? "Guest"} · {location}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                        config?.color ?? "text-gray-400"
                      }`}
                    >
                      {config?.label ?? order.status}
                    </span>
                    <span className="text-sm text-white font-medium tabular-nums">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footnote explaining definitions */}
      <div className="bg-gray-900/40 rounded-xl border border-gray-800/60 p-4">
        <p className="text-[11px] text-gray-500 leading-relaxed">
          <span className="text-gray-400 font-medium">How numbers are calculated:</span>{" "}
          <strong className="text-gray-400">Net revenue</strong> = paid orders minus refunds captured on Razorpay.{" "}
          <strong className="text-gray-400">Paid orders</strong> exclude PENDING, CANCELLED and FAILED states.{" "}
          <strong className="text-gray-400">Return rate</strong> counts any order in RETURN_REQUESTED, RETURNED, REFUND_INITIATED or REFUNDED over total paid orders.{" "}
          <strong className="text-gray-400">New customers</strong> are first-time paying buyers in the selected window.{" "}
          Trends compare against the immediately preceding period of the same length.
        </p>
      </div>
    </div>
  );
}
