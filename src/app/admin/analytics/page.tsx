import { Suspense } from "react";

import {
  resolveDateRange,
  previousPeriod,
  type DateRange,
  getHeadlineMetrics,
  getDailyTimeline,
  getStatusBreakdown,
  getPaymentMethodBreakdown,
  getCityBreakdown,
  getStateBreakdown,
  getTopProducts,
  getRecentOrdersInRange,
} from "@/lib/analytics";
import {
  amazonHasAnySnapshots,
  getAmazonHeadlineMetrics,
  getAmazonDailyTimeline,
  getAmazonStatusBreakdown,
  getAmazonFulfillmentBreakdown,
  getAmazonCityBreakdown,
  getAmazonStateBreakdown,
  getAmazonTopSkus,
  getAmazonRecentOrders,
} from "@/lib/amazon-analytics";

import { AnalyticsFilterBar } from "@/components/admin/analytics/filter-bar";
import { AnalyticsChannelTabs } from "@/components/admin/analytics/analytics-channel-tabs";
import { WebsiteAnalyticsDashboard } from "@/components/admin/analytics/website-analytics-dashboard";
import { AmazonAnalyticsDashboard } from "@/components/admin/analytics/amazon-analytics-dashboard";

export const metadata = { title: "Analytics | Magadh Recipe Admin" };
export const dynamic = "force-dynamic";

interface SearchParams {
  preset?: string;
  from?: string;
  to?: string;
  channel?: string;
}

function resolveChannel(channel: string | undefined): "website" | "amazon" {
  return channel === "amazon" ? "amazon" : "website";
}

/** Seller Central deep links (.in vs .com) — defaults to India. */
function resolveAmazonSellerCentralHost(): "IN" | "DEFAULT" {
  const h = process.env.AMAZON_SELLER_CENTRAL_REGION?.trim().toLowerCase();
  if (h === "us" || h === "com" || h === "default" || h === "na") return "DEFAULT";
  return "IN";
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const range = resolveDateRange({
    preset: params.preset,
    from: params.from,
    to: params.to,
  });
  const prev = previousPeriod(range);
  const channel = resolveChannel(params.channel);

  const marketplaceSellerCentral = resolveAmazonSellerCentralHost();

  const channelTabsFallback = (
    <div className="inline-flex h-10 min-w-[12rem] rounded-xl bg-gray-800/50 border border-gray-700 animate-pulse" aria-hidden />
  );

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Sales and marketplace snapshots — pick a channel below, then tune the date range.
          </p>
        </div>
        <Suspense fallback={channelTabsFallback}>
          <AnalyticsChannelTabs channel={channel} />
        </Suspense>
      </div>

      <AnalyticsFilterBar
        activePreset={range.preset}
        from={range.preset === "custom" ? range.from.toISOString() : undefined}
        to={range.preset === "custom" ? range.to.toISOString() : undefined}
        rangeLabel={range.label}
        channel={channel}
      />

      {channel === "website" ? (
        <WebsiteReports range={range} prev={prev} />
      ) : (
        <AmazonReports
          range={range}
          prev={prev}
          hasSnapshotsPromise={amazonHasAnySnapshots()}
          marketplaceSellerCentral={marketplaceSellerCentral}
        />
      )}
    </div>
  );
}

async function WebsiteReports({ range, prev }: { range: DateRange; prev: DateRange }) {
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
    <WebsiteAnalyticsDashboard
      headline={headline}
      prevHeadline={prevHeadline}
      timeline={timeline}
      statusRows={statusRows}
      paymentRows={paymentRows}
      cityRows={cityRows}
      stateRows={stateRows}
      topProducts={topProducts}
      recentOrders={recentOrders}
    />
  );
}

async function AmazonReports({
  range,
  prev,
  hasSnapshotsPromise,
  marketplaceSellerCentral,
}: {
  range: DateRange;
  prev: DateRange;
  hasSnapshotsPromise: Promise<boolean>;
  marketplaceSellerCentral: "IN" | "DEFAULT";
}) {
  const [
    hasSyncedData,
    headline,
    prevHeadline,
    timeline,
    statusRows,
    fulfillmentRows,
    cityRows,
    stateRows,
    topSkus,
    recentOrders,
  ] = await Promise.all([
    hasSnapshotsPromise,
    getAmazonHeadlineMetrics(range),
    getAmazonHeadlineMetrics(prev),
    getAmazonDailyTimeline(range),
    getAmazonStatusBreakdown(range),
    getAmazonFulfillmentBreakdown(range),
    getAmazonCityBreakdown(range, 12),
    getAmazonStateBreakdown(range, 10),
    getAmazonTopSkus(range, 10),
    getAmazonRecentOrders(range, 10),
  ]);

  return (
    <AmazonAnalyticsDashboard
      hasSyncedData={hasSyncedData}
      marketplaceSellerCentral={marketplaceSellerCentral}
      headline={headline}
      prevHeadline={prevHeadline}
      timeline={timeline}
      statusRows={statusRows}
      fulfillmentRows={fulfillmentRows}
      cityRows={cityRows}
      stateRows={stateRows}
      topSkus={topSkus}
      recentOrders={recentOrders}
    />
  );
}
