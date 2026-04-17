"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { DotLottie } from "@lottiefiles/dotlottie-web";
import { type ReactNode, useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import fallbackData from "@/assets/lottie/pickle-empty.json";

const REMOTE = process.env.NEXT_PUBLIC_PRODUCTS_EMPTY_LOTTIE_URL;
const LOCAL_JSON = "/lottie/no-item-found.json";
/** Bundled empty-state animation — copy from Downloads or export from LottieFiles into `public/lottie/`. */
const LOCAL_DOTLOTTIE = "/lottie/product_not_found.lottie";

function isDotLottieUrl(url: string): boolean {
  return /\.lottie(\?|#|$)/i.test(url);
}

function skeleton() {
  return (
    <div
      className="relative mx-auto mb-2 w-full max-w-md aspect-[4/3] max-h-[240px] rounded-2xl bg-cream-200/35 animate-pulse"
      aria-hidden
    />
  );
}

function card(children: ReactNode, relativeForSkeleton?: boolean) {
  return (
    <div className="relative mx-auto mb-2 w-full max-w-md" aria-hidden>
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-b from-brand-100/20 via-transparent to-emerald-50/15 blur-2xl pointer-events-none" />
      <div className="relative rounded-2xl border border-earth-200/30 bg-white/65 px-3 py-4 shadow-[0_10px_36px_rgba(44,24,16,0.06)] backdrop-blur-sm sm:px-5 sm:py-5">
        <div
          className={`mx-auto w-full max-h-[240px] min-h-[200px] sm:min-h-[220px] ${relativeForSkeleton ? "relative" : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Empty grid illustration.
 * Order: optional `NEXT_PUBLIC_PRODUCTS_EMPTY_LOTTIE_URL` (.lottie or Lottie JSON URL) →
 * `public/lottie/product_not_found.lottie` → `public/lottie/no-item-found.json` → bundled pickle.
 */
export function PickleEmptyLottie() {
  const remote = REMOTE?.trim() ?? "";
  const jsonOnly = Boolean(remote && !isDotLottieUrl(remote));
  const dotSrc = jsonOnly
    ? null
    : remote && isDotLottieUrl(remote)
      ? remote
      : LOCAL_DOTLOTTIE;

  const [jsonData, setJsonData] = useState<unknown | null>(null);
  const [useJsonFallback, setUseJsonFallback] = useState(jsonOnly);
  const [dotShowSkeleton, setDotShowSkeleton] = useState(!jsonOnly);

  const dotCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => dotCleanupRef.current?.(), []);

  useEffect(() => {
    if (!jsonOnly) return;
    let cancelled = false;
    fetch(remote, { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (!cancelled) setJsonData(j);
      })
      .catch(() => {
        if (!cancelled) setJsonData(fallbackData);
      });
    return () => {
      cancelled = true;
    };
  }, [jsonOnly, remote]);

  useEffect(() => {
    if (!useJsonFallback || jsonOnly) return;
    let cancelled = false;
    fetch(LOCAL_JSON, { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (!cancelled) setJsonData(j);
      })
      .catch(() => {
        if (!cancelled) setJsonData(fallbackData);
      });
    return () => {
      cancelled = true;
    };
  }, [useJsonFallback, jsonOnly]);

  const attachDotListeners = (dotLottie: DotLottie | null) => {
    dotCleanupRef.current?.();
    dotCleanupRef.current = null;
    if (!dotLottie) return;

    const onLoad = () => setDotShowSkeleton(false);
    const onErr = () => {
      setUseJsonFallback(true);
      setDotShowSkeleton(false);
      setJsonData(null);
    };

    dotLottie.addEventListener("load", onLoad);
    dotLottie.addEventListener("loadError", onErr);
    dotCleanupRef.current = () => {
      dotLottie.removeEventListener("load", onLoad);
      dotLottie.removeEventListener("loadError", onErr);
    };
  };

  if (jsonOnly) {
    if (jsonData === null) return skeleton();
    return card(<Lottie animationData={jsonData} loop className="h-full w-full" />);
  }

  if (!useJsonFallback && dotSrc) {
    return card(
      <>
        {dotShowSkeleton ? (
          <div
            className="absolute inset-0 z-10 rounded-xl bg-cream-200/40 animate-pulse"
            aria-hidden
          />
        ) : null}
        <DotLottieReact
          src={dotSrc}
          loop
          autoplay
          className="h-full w-full max-h-[240px]"
          dotLottieRefCallback={attachDotListeners}
        />
      </>,
      true,
    );
  }

  if (jsonData === null) return skeleton();
  return card(<Lottie animationData={jsonData} loop className="h-full w-full" />);
}
