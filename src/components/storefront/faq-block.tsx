"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqBlockItem {
  question: string;
  answer: string;
}

interface Props {
  items: FaqBlockItem[];
  title?: string;
  subtitle?: string;
  className?: string;
  defaultOpenIndex?: number;
}

/**
 * Visual FAQ accordion. Pair it with <JsonLd data={faqSchema(items)} /> on the
 * parent server component so the schema emits without forcing client-side
 * hydration just to render JSON-LD.
 */
export function FaqBlock({
  items,
  title = "Frequently asked questions",
  subtitle,
  className,
  defaultOpenIndex = 0,
}: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(defaultOpenIndex);

  if (items.length === 0) return null;

  return (
    <section className={cn("w-full", className)}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-earth-dark">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-earth-500 text-sm mt-1.5">{subtitle}</p>
          )}
        </div>
      )}

      <div className="divide-y divide-earth-200/60 border border-earth-200/60 rounded-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
        {items.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-cream-50/70 transition-colors"
              >
                <span className="text-sm sm:text-base font-semibold text-earth-dark">
                  {item.question}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-earth-500 shrink-0 transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-200 ease-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm text-earth-700 leading-relaxed whitespace-pre-line">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
