import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { breadcrumbSchema, type BreadcrumbTrailItem } from "@/lib/schema";
import { JsonLd } from "@/components/seo/json-ld";

interface Props {
  items: BreadcrumbTrailItem[];
  className?: string;
  /** If false, skips rendering the visual trail (schema still emitted). */
  showVisual?: boolean;
  /** If true, forces dark-surface color scheme. */
  onDark?: boolean;
}

/**
 * Visual breadcrumb trail + JSON-LD BreadcrumbList. Always include "Home"
 * as the first item; the component does that automatically if not passed.
 */
export function Breadcrumbs({
  items,
  className,
  showVisual = true,
  onDark = false,
}: Props) {
  const trail: BreadcrumbTrailItem[] =
    items[0]?.href === "/"
      ? items
      : [{ label: "Home", href: "/" }, ...items];

  const schema = breadcrumbSchema(trail);

  return (
    <>
      <JsonLd data={schema} id="breadcrumb" />
      {showVisual && (
        <nav
          aria-label="Breadcrumb"
          className={cn(
            "text-xs flex items-center gap-1 flex-wrap",
            onDark ? "text-cream-300/70" : "text-earth-500",
            className
          )}
        >
          {trail.map((item, i) => {
            const isLast = i === trail.length - 1;
            const isHome = i === 0;
            return (
              <span key={`${item.href}-${i}`} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight
                    className={cn(
                      "w-3 h-3 shrink-0",
                      onDark ? "text-cream-400/40" : "text-earth-300"
                    )}
                  />
                )}
                {isLast ? (
                  <span
                    className={cn(
                      "truncate max-w-[180px] sm:max-w-[260px] font-medium",
                      onDark ? "text-cream-100" : "text-earth-dark"
                    )}
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 hover:underline transition-colors",
                      onDark
                        ? "hover:text-brand-300"
                        : "hover:text-brand-600"
                    )}
                  >
                    {isHome ? (
                      <>
                        <Home className="w-3 h-3" aria-hidden />
                        <span className="sr-only sm:not-sr-only">{item.label}</span>
                      </>
                    ) : (
                      <span className="truncate max-w-[140px] sm:max-w-[200px]">
                        {item.label}
                      </span>
                    )}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      )}
    </>
  );
}
