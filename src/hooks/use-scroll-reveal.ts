"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Observes elements with data-reveal attribute and adds "revealed" class
 * when they enter the viewport. Supports staggered delays via data-delay.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  threshold = 0.12
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const allTargets =
      targets.length > 0
        ? Array.from(targets)
        : root.hasAttribute("data-reveal")
          ? [root]
          : [root];

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("revealed");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    allTargets.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [threshold]);

  return ref;
}

/**
 * Tracks scroll progress within a container element.
 * Returns a ref and triggers callback with progress (0-1).
 */
export function useScrollProgress(
  onProgress: (progress: number) => void,
  deps: unknown[] = []
) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.min(Math.max(-rect.top / total, 0), 1);
      onProgress(progress);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onProgress, ...deps]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(raf.current);
    };
  }, [handleScroll]);

  return ref;
}
