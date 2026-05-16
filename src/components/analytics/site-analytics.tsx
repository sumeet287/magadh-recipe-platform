import { Suspense } from "react";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

import { AnalyticsRouteTracker } from "@/components/analytics/analytics-route-tracker";

const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

/**
 * Loads GTM or GA (not both scripts — avoid duplicate page_views when GA is wired via GTM).
 * Set `NEXT_PUBLIC_GTM_ID` and configure GA4 inside the container **or** set `NEXT_PUBLIC_GA_MEASUREMENT_ID` alone.
 */
export function SiteAnalytics() {
  const useGtm = Boolean(gtmId);
  const useGaOnly = Boolean(gaId) && !useGtm;

  if (!useGtm && !useGaOnly) {
    return null;
  }

  return (
    <>
      {useGtm && gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
      {useGaOnly && gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      <Suspense fallback={null}>
        <AnalyticsRouteTracker analyticsMode={useGtm ? "gtm" : "ga"} />
      </Suspense>
    </>
  );
}
