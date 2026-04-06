"use client";

import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number; // 0 to 5
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  showCount?: number;
  className?: string;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export function Rating({
  value,
  max = 5,
  size = "md",
  showValue = false,
  showCount,
  className,
  interactive = false,
  onChange,
}: RatingProps) {
  const sizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < Math.floor(value);
          const halfFilled = !filled && i < value;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(i + 1)}
              className={cn(
                "transition-transform",
                interactive && "hover:scale-110 cursor-pointer",
                !interactive && "cursor-default"
              )}
            >
              {halfFilled ? (
                <StarHalf
                  className={cn(sizes[size], "text-turmeric-500 fill-turmeric-500")}
                />
              ) : (
                <Star
                  className={cn(
                    sizes[size],
                    filled
                      ? "text-turmeric-500 fill-turmeric-500"
                      : "text-gray-300 fill-gray-100"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className={cn("font-semibold text-earth-dark", textSizes[size])}>
          {value.toFixed(1)}
        </span>
      )}
      {showCount !== undefined && (
        <span className={cn("text-gray-500", textSizes[size])}>
          ({showCount.toLocaleString("en-IN")})
        </span>
      )}
    </div>
  );
}

// Rating distribution bar
interface RatingBarProps {
  distribution: { star: number; count: number; percentage: number }[];
  total: number;
  average: number;
}

export function RatingBar({ distribution, total, average }: RatingBarProps) {
  return (
    <div className="flex gap-6">
      {/* Average */}
      <div className="flex flex-col items-center justify-center min-w-[80px]">
        <div className="text-4xl font-bold text-earth-dark font-serif">
          {average.toFixed(1)}
        </div>
        <Rating value={average} size="sm" />
        <div className="text-xs text-gray-500 mt-1">
          {total.toLocaleString("en-IN")} reviews
        </div>
      </div>

      {/* Bars */}
      <div className="flex-1 space-y-1.5">
        {distribution.map(({ star, count, percentage }) => (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-right text-gray-600">{star}</span>
            <Star className="w-3 h-3 text-turmeric-500 fill-turmeric-500 shrink-0" />
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-turmeric-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-gray-500">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
