"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { pushShopEvent } from "@/lib/analytics/shop-events";

function isCartContinuationPath(path: string) {
  if (path === "/checkout") return true;
  if (path === "/products" || path.startsWith("/products/")) return true;
  return false;
}

/**
 * SPA route-change drops: leaving `/cart` or `/checkout` without continuing the buying path.
 * Paths like `/checkout/success` do not trigger checkout abandon when leaving `/checkout`.
 */
export function ShopRouteFunnelWatch() {
  const pathname = usePathname() ?? "/";
  const prev = useRef<string | undefined>(undefined);
  const { data: session } = useSession();

  useEffect(() => {
    const was = prev.current;
    if (was != null && was !== pathname) {
      if (
        was === "/cart" &&
        pathname !== "/cart" &&
        !isCartContinuationPath(pathname)
      ) {
        pushShopEvent(
          {
            event: "mr_cart_abandon",
            mr_from_path: was,
            mr_to_path: pathname,
          },
          session ?? null
        );
      }

      if (
        was === "/checkout" &&
        pathname !== "/checkout" &&
        pathname !== "/checkout/success"
      ) {
        pushShopEvent(
          {
            event: "mr_checkout_abandon",
            mr_from_path: was,
            mr_to_path: pathname,
          },
          session ?? null
        );
      }
    }

    prev.current = pathname;
  }, [pathname, session]);

  return null;
}
