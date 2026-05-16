import { IndianRupee, ShoppingBag, TrendingUp, XCircle, MapPin, Package, Warehouse, Truck, ExternalLink } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import {
  amazonSellerCentralOrderUrl,
  type AmazonHeadlineMetrics,
  type AmazonDailyPoint,
  type AmazonStatusRow,
  type AmazonChannelRow,
  type AmazonGeoRow,
  type AmazonTopSkuRow,
} from "@/lib/amazon-analytics";

import { MetricCard } from "@/components/admin/analytics/metric-card";
import { RevenueTimeline } from "@/components/admin/analytics/revenue-timeline";
import { TopList, formatGeoItem } from "@/components/admin/analytics/top-list";
import { AmazonStatusGrid } from "@/components/admin/analytics/amazon-status-grid";
import { FulfillmentBreakdown } from "@/components/admin/analytics/fulfillment-breakdown";
import { AmazonManualSyncButton } from "@/components/admin/analytics/amazon-sync-button";

function cancelRatePct(m: Pick<AmazonHeadlineMetrics, "canceledOrders" | "totalIncludingCanceled">): number {
  return m.totalIncludingCanceled > 0 ? (m.canceledOrders / m.totalIncludingCanceled) * 100 : 0;
}

function recentBadgeClass(status: string) {
  const u = status.toUpperCase();
  if (u.includes("CANCEL")) return "text-red-400";
  if (u.includes("SHIP") || u.includes("COMPLETE") || u.includes("DELIVER")) return "text-green-400";
  if (u.includes("RETURN") || u.includes("REFUND")) return "text-amber-400";
  return "text-blue-400";
}

type RecentAmazonOrder = {
  amazonOrderId: string;
  purchaseDate: Date;
  orderStatus: string;
  orderTotalBuyer: number | null;
  shipCity: string | null;
  shipState: string | null;
};

interface Props {
  hasSyncedData: boolean;
  marketplaceSellerCentral: "IN" | "DEFAULT";
  headline: AmazonHeadlineMetrics;
  prevHeadline: AmazonHeadlineMetrics;
  timeline: AmazonDailyPoint[];
  statusRows: AmazonStatusRow[];
  fulfillmentRows: AmazonChannelRow[];
  cityRows: AmazonGeoRow[];
  stateRows: AmazonGeoRow[];
  topSkus: AmazonTopSkuRow[];
  recentOrders: RecentAmazonOrder[];
}

export function AmazonAnalyticsDashboard({
  hasSyncedData,
  marketplaceSellerCentral,
  headline,
  prevHeadline,
  timeline,
  statusRows,
  fulfillmentRows,
  cityRows,
  stateRows,
  topSkus,
  recentOrders,
}: Props) {
  const currCancel = cancelRatePct(headline);
  const prevCancel = cancelRatePct(prevHeadline);

  const fbaPctKnown =
    headline.fulfillmentKnown > 0 ? (headline.fbaOrders / headline.fulfillmentKnown) * 100 : null;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <AmazonManualSyncButton />
        <p className="text-[11px] text-gray-600 max-w-md leading-relaxed">
          Uses your SP-API credentials. If the button returns 400, add <code className="text-gray-500">LWA_*</code> env vars — see{" "}
          <code className="text-gray-500">.env.example</code>.
        </p>
      </div>

      {!hasSyncedData && (
        <div className="rounded-xl border border-amber-800/45 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/90 leading-relaxed">
          <strong className="font-semibold text-amber-50">Amazon data has not synced yet.</strong>{" "}
          Add <code className="text-amber-200/95 text-xs px-1">LWA_*</code> credentials in your environment, then run{" "}
          <strong className="font-medium text-amber-50/95">POST /api/admin/amazon/sync-orders</strong> (while signed in as admin) or schedule{" "}
          <code className="text-amber-200/95 text-xs px-1">GET /api/cron/amazon-orders-sync</code>. Orders land in{" "}
          <code className="text-amber-200/95 text-xs px-1">amazon_marketplace_orders</code> and this tab reads only that table.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Marketplace revenue"
          value={formatCurrency(headline.netRevenue)}
          sub={`Sum of synced buyer-visible order totals (fees/refunds not netted separately)`}
          previousValue={prevHeadline.netRevenue}
          currentValue={headline.netRevenue}
          icon={IndianRupee}
          tone="success"
        />
        <MetricCard
          label="Amazon orders"
          value={headline.amazonOrdersCounted.toLocaleString()}
          sub={`Realized (${headline.totalIncludingCanceled.toLocaleString()} snapshots incl. canceled)`}
          previousValue={prevHeadline.amazonOrdersCounted}
          currentValue={headline.amazonOrdersCounted}
          icon={ShoppingBag}
          tone="info"
        />
        <MetricCard
          label="Average order value"
          value={formatCurrency(headline.avgOrderValue)}
          sub={`vs ${formatCurrency(prevHeadline.avgOrderValue)} prior window`}
          previousValue={prevHeadline.avgOrderValue}
          currentValue={headline.avgOrderValue}
          icon={TrendingUp}
          tone="warning"
        />
        <MetricCard
          label="Cancel share"
          value={`${currCancel.toFixed(1)}%`}
          sub={`${headline.canceledOrders} canceled / ${headline.totalIncludingCanceled} snapshots`}
          previousValue={prevCancel}
          currentValue={currCancel}
          inverseTrend
          icon={XCircle}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Ship-to locales"
          value={headline.shipToLocales.toLocaleString()}
          sub="Distinct city + state pairs (realized)"
          previousValue={prevHeadline.shipToLocales}
          currentValue={headline.shipToLocales}
          icon={MapPin}
          tone="info"
        />
        <MetricCard
          label="Units sold"
          value={headline.unitsSold.toLocaleString()}
          sub={`Across all line items on realized orders`}
          previousValue={prevHeadline.unitsSold}
          currentValue={headline.unitsSold}
          icon={Package}
          tone="success"
        />
        <MetricCard
          label="FBA orders"
          value={headline.fbaOrders.toLocaleString()}
          sub={
            fbaPctKnown !== null
              ? `${fbaPctKnown.toFixed(0)}% of orders with known fulfillment channel`
              : `Fulfillment channel missing on synced rows`
          }
          previousValue={prevHeadline.fbaOrders}
          currentValue={headline.fbaOrders}
          icon={Warehouse}
          tone="warning"
        />
        <MetricCard
          label="FBM orders"
          value={headline.fbmOrders.toLocaleString()}
          sub="Merchant‑fulfilled (MFN) where labeled"
          previousValue={prevHeadline.fbmOrders}
          currentValue={headline.fbmOrders}
          icon={Truck}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueTimeline data={timeline} metric="revenue" />
        </div>
        <RevenueTimeline data={timeline} metric="orders" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AmazonStatusGrid title="Amazon order status" rows={statusRows} totalCount={headline.totalIncludingCanceled} />
        </div>
        <FulfillmentBreakdown rows={fulfillmentRows} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopList
          title="Top cities"
          subtitle="Buyer ship-to on realized orders"
          items={cityRows.map(formatGeoItem)}
          accentClass="bg-brand-600/50"
        />
        <TopList
          title="Top states"
          subtitle="Buyer ship-to on realized orders"
          items={stateRows.map(formatGeoItem)}
          accentClass="bg-blue-600/50"
        />
      </div>

      <TopList
        title="Top SKUs"
        subtitle="From synced line-item revenue"
        emptyMessage="No line items synced for realized orders"
        items={topSkus.map((p) => ({
          key: p.skuKey,
          label: p.label,
          sublabel: `${p.quantity} units`,
          value: p.revenue,
          valueLabel: formatCurrency(p.revenue),
          secondaryLabel: `${p.quantity} sold`,
        }))}
        accentClass="bg-green-600/50"
      />

      <div className="bg-gray-900 rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent synced orders</h3>
            <p className="text-xs text-gray-500">Newest snapshots first · opens Seller Central</p>
          </div>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-600 py-10 text-center">No Amazon snapshots in this period</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {recentOrders.map((order) => {
              const ship =
                order.shipCity || order.shipState
                  ? [order.shipCity, order.shipState].filter(Boolean).join(", ")
                  : "—";
              const href = amazonSellerCentralOrderUrl(marketplaceSellerCentral, order.amazonOrderId);
              return (
                <a
                  key={order.amazonOrderId}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-800/40 transition-colors gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium font-mono truncate">{order.amazonOrderId}</p>
                    <p className="text-xs text-gray-500 truncate">{ship}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${recentBadgeClass(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                    <span className="text-sm text-white font-medium tabular-nums">
                      {formatCurrency(order.orderTotalBuyer ?? 0)}
                    </span>
                    <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-gray-900/40 rounded-xl border border-gray-800/60 p-4">
        <p className="text-[11px] text-gray-500 leading-relaxed">
          <span className="text-gray-400 font-medium">How numbers are calculated:</span>{" "}
          <strong className="text-gray-400">Marketplace revenue</strong> totals{" "}
          <code className="text-[10px] text-gray-600">orderTotalBuyer</code> on snapshot rows whose status text does not include &quot;CANCEL&quot;.
          Razorpay, storefront statuses, repeat buyers, and returns are intentionally out of scope here. Fees, shipping services, refunds, or chargebacks{" "}
          from Amazon ledger are only reflected indirectly if your sync maps them onto these totals. Geography uses ship-to visible on synced orders (may be approximate).
          Trends compare against the preceding period of the same length as the date filter above.
        </p>
      </div>
    </>
  );
}
