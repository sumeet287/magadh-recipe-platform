"use client";

import { sendGAEvent, sendGTMEvent } from "@next/third-parties/google";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

function routeIgnorePrefixes(): string[] {
  const raw =
    typeof process.env.NEXT_PUBLIC_ANALYTICS_ROUTE_IGNORE_PREFIXES === "string"
      ? process.env.NEXT_PUBLIC_ANALYTICS_ROUTE_IGNORE_PREFIXES
      : "/admin";

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

interface Props {
  analyticsMode: "gtm" | "ga";
}

/**
 * Sends a synthetic page-view on Next.js soft navigations only (skipped on first paint — full load hits GTM/GA tags).
 */
export function AnalyticsRouteTracker({ analyticsMode }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skippedFirstSoftNav = useRef(false);

  useEffect(() => {
    const prefixes = routeIgnorePrefixes();
    const base = pathname ?? "/";
    const query = searchParams?.toString();
    const qs = query ? `?${query}` : "";

    if (prefixes.some((prefix) => base.startsWith(prefix))) {
      return;
    }

    if (!skippedFirstSoftNav.current) {
      skippedFirstSoftNav.current = true;
      return;
    }

    if (typeof window === "undefined") return;

    const pageLocation = `${window.location.origin}${base}${qs}`;

    if (analyticsMode === "gtm") {
      sendGTMEvent({
        event: "virtual_page_view",
        page_path: base,
        page_location: pageLocation,
        page_title: document.title,
      });
      return;
    }

    sendGAEvent("event", "page_view", {
      page_path: `${base}${qs}`,
      page_location: pageLocation,
      page_title: document.title,
    });
  }, [pathname, searchParams, analyticsMode]);

  return null;
}
