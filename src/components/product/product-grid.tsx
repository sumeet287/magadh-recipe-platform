import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
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
    return <ProductGridSkeleton count={skeletonCount} />;
  }

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4">🫙</div>
        <h3 className="font-serif font-semibold text-earth-dark text-xl mb-2">
          No products found
        </h3>
        <p className="text-gray-500 text-sm">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 ${className ?? ""}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
