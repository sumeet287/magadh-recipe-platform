"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { pushShopEvent } from "@/lib/analytics/shop-events";

/** One shot storefront home beacon with signed-in context (via GTM→GA4). */
export function HomeShopBeacon() {
  const { data: session, status } = useSession();
  const fired = useRef(false);

  useEffect(() => {
    // NextAuth hydrates session async; first paint often has session=null. If we fire once
    // then, mr_logged_in stays false forever due to `fired`.
    if (status === "loading") return;
    if (fired.current) return;
    fired.current = true;
    pushShopEvent({ event: "mr_view_home" }, session ?? null);
  }, [session, status]);

  return null;
}
