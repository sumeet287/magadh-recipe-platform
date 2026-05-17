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

/** Drop duplicate virtual_page_view for the same URL within a short window (Next + Strict Mode + batched updates). */
let lastVpvRouteKey = "";
let lastVpvAt = 0;
const VPV_DEDUP_MS = 350;

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
     * Longer delay coalesces batched router updates so Tag Assistant shows one push, not two.
     */
    const t = window.setTimeout(() => {
      if (typeof window === "undefined") return;

      const routeKey = `${base}${qs}`;
      const now = Date.now();
      if (
        routeKey === lastVpvRouteKey &&
        now - lastVpvAt < VPV_DEDUP_MS
      ) {
        return;
      }

      if (!virtualPageViewBootSkipped) {
        virtualPageViewBootSkipped = true;
        lastVpvRouteKey = routeKey;
        lastVpvAt = now;
        return;
      }

      lastVpvRouteKey = routeKey;
      lastVpvAt = now;

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
    }, 120);

    return () => window.clearTimeout(t);
  }, [pathname, searchParams, analyticsMode]);

  return null;
}
