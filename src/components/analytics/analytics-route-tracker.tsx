"use client";

import { sendGAEvent, sendGTMEvent } from "@next/third-parties/google";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

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
 * Skip first synthetic SPA message so it doesn't double-count with the full page_load hit.
 * Module-level so React Strict Mode remounts don't reset the guard and double-fire.
 */
let virtualPageViewBootSkipped = false;

/**
 * Sends a synthetic page-view on Next.js soft navigations only (skipped on first paint — full load hits GTM/GA tags).
 */
export function AnalyticsRouteTracker({ analyticsMode }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const prefixes = routeIgnorePrefixes();
    const base = pathname ?? "/";
    const query = searchParams?.toString();
    const qs = query ? `?${query}` : "";

    if (prefixes.some((prefix) => base.startsWith(prefix))) {
      return;
    }

    /**
     * Debounce: pathname + searchParams can update in quick succession; Strict Mode runs effects twice in dev.
     * One timer coalesces to a single virtual_page_view per navigation.
     */
    const t = window.setTimeout(() => {
      if (typeof window === "undefined") return;

      if (!virtualPageViewBootSkipped) {
        virtualPageViewBootSkipped = true;
        return;
      }

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
    }, 50);

    return () => window.clearTimeout(t);
  }, [pathname, searchParams, analyticsMode]);

  return null;
}
