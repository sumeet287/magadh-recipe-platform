import { ProductCard } from "./product-card";
import { ProductGridEmpty } from "./product-grid-empty";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/types";

interface ProductGridProps {
  products: ProductCardData[];
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
}

export function ProductGrid({
  products,
  loading = false,
  skeletonCount = 8,
  className,
}: ProductGridProps) {
  if (loading) {
    return <ProductGridSkeleton count={skeletonCount} className={className} />;
  }

  if (!products.length) {
    return <ProductGridEmpty />;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6",
        className
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
