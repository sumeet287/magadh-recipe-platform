import { cn } from "@/lib/utils";
import { SPICE_LEVEL_CONFIG } from "@/lib/constants";
import type { SpiceLevel } from "@prisma/client";

interface SpiceMeterProps {
  level: SpiceLevel;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function SpiceMeter({
  level,
  showLabel = true,
  size = "md",
  className,
}: SpiceMeterProps) {
  const config = SPICE_LEVEL_CONFIG[level];
  const maxCount = 4;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-0.5">
        {Array.from({ length: maxCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-full transition-all",
              size === "sm" ? "w-2 h-2" : "w-3 h-3",
              i < config.count
                ? "opacity-100"
                : "opacity-20 bg-gray-300"
            )}
            style={
              i < config.count
                ? { backgroundColor: config.color }
                : undefined
            }
          />
        ))}
      </div>
      {showLabel && (
        <span
          className={cn(
            "font-medium",
            size === "sm" ? "text-xs" : "text-sm"
          )}
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}
