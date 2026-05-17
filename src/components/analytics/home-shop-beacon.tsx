"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { pushShopEvent } from "@/lib/analytics/shop-events";

const HOME_BEACON_SENT = "__mr_view_home_sent";

declare global {
  interface Window {
    [HOME_BEACON_SENT]?: boolean;
  }
}

/** One shot storefront home beacon with signed-in context (via GTM→GA4). */
export function HomeShopBeacon() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // NextAuth hydrates session async; wait until settled.
    if (status === "loading") return;

    const w = window as Window;

    /**
     * React Strict Mode (dev) remounts wipe component refs → duplicate pushes.
     * First push can land before GA/GTM is subscribed → Tag Assistant shows one row
     * with no hit. Use window + deferred tick so exactly one beacon fires slightly later.
     */
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      if (w[HOME_BEACON_SENT]) return;
      w[HOME_BEACON_SENT] = true;
      pushShopEvent({ event: "mr_view_home" }, session ?? null);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [session, status]);

  return null;
}
