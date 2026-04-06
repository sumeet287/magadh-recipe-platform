"use client";

import { useEffect, useRef } from "react";

/**
 * Adds `revealed` class to the element when it enters the viewport.
 * Works with the `.reveal-up` CSS class in globals.css.
 */
export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref as React.RefObject<HTMLElement>;
}
