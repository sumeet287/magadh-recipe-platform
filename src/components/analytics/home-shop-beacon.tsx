"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { pushShopEvent } from "@/lib/analytics/shop-events";

/** One shot storefront home beacon with signed-in context (via GTM→GA4). */
export function HomeShopBeacon() {
  const { data: session } = useSession();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    pushShopEvent({ event: "mr_view_home" }, session ?? null);
  }, [session]);

  return null;
}
