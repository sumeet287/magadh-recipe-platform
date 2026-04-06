import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full text-xs font-semibold transition-colors px-2.5 py-0.5",
  {
    variants: {
      variant: {
        default: "bg-brand-500 text-white",
        secondary: "bg-earth-100 text-earth-dark",
        outline: "border border-brand-500 text-brand-600 bg-transparent",
        success: "bg-green-100 text-green-700",
        destructive: "bg-red-100 text-red-700",
        warning: "bg-amber-100 text-amber-700",
        info: "bg-blue-100 text-blue-700",
        premium: "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm",
        bestseller: "bg-spice-500 text-white",
        new: "bg-turmeric-500 text-white",
        veg: "bg-green-500 text-white",
        nonveg: "bg-spice-600 text-white",
        mild: "bg-green-100 text-green-700",
        medium: "bg-amber-100 text-amber-700",
        hot: "bg-orange-100 text-orange-700",
        "extra-hot": "bg-red-100 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

// Veg/Non-Veg indicator (standard Indian packaging)
function VegIndicator({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded border-2 shrink-0",
        isVeg
          ? "border-green-600 bg-white"
          : "border-red-600 bg-white"
      )}
      title={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span
        className={cn(
          "w-2.5 h-2.5 rounded-full",
          isVeg ? "bg-green-600" : "bg-red-600"
        )}
      />
    </span>
  );
}

export { Badge, badgeVariants, VegIndicator };
