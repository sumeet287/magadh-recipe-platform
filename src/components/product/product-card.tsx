"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { cn, formatCurrency, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useUIStore } from "@/store/ui-store";
import { Badge, VegIndicator } from "@/components/ui/badge";
import type { ProductCardData } from "@/types";

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
  compact?: boolean;
}

export function ProductCard({ product, className, compact = false }: ProductCardProps) {
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const frameRef = useRef<number>(0);

  const handleTiltMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transition = "box-shadow 0.3s ease";
      el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale3d(1.02,1.02,1.02)`;
      el.style.setProperty("--shine-x", `${(x + 0.5) * 100}%`);
      el.style.setProperty("--shine-y", `${(y + 0.5) * 100}%`);
    });
  }, []);

  const handleTiltLeave = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    cancelAnimationFrame(frameRef.current);
    const el = e.currentTarget;
    el.style.transition = "transform 0.55s cubic-bezier(.03,.98,.52,.99), box-shadow 0.3s ease";
    el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
    setIsHovered(false);
  }, []);

  const { addItem, setOpen } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addToast, addRecentlyViewed } = useUIStore();

  const selectedVariant = product.variants[selectedVariantIdx];
  const primaryImage = product.images.find((img) => img.isPrimary) ?? product.images[0];
  const secondaryImage = product.images[1];
  const inWishlist = isInWishlist(product.id);
  const discount = selectedVariant
    ? calculateDiscount(selectedVariant.mrp, selectedVariant.price)
    : 0;
  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedVariant || isOutOfStock) return;

    addItem({
      id: `${product.id}-${selectedVariant.id}`,
      cartId: "",
      productId: product.id,
      variantId: selectedVariant.id,
      quantity: 1,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: primaryImage?.url,
      },
      variant: {
        id: selectedVariant.id,
        name: selectedVariant.name,
        price: selectedVariant.price,
        mrp: selectedVariant.mrp,
        stock: selectedVariant.stock,
        sku: "",
      },
    });

    addToast({
      type: "success",
      message: `${product.name} added to cart!`,
    });
    setOpen(true);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product.id);
    addToast({
      type: inWishlist ? "info" : "success",
      message: inWishlist
        ? "Removed from wishlist"
        : `${product.name} added to wishlist!`,
    });
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        "group relative rounded-2xl overflow-hidden tilt-card flex flex-col transition-all duration-500",
        "bg-gradient-to-b from-white to-[#fffcf7]",
        "border border-brand-100/60 hover:border-brand-300/50",
        "shadow-[0_2px_16px_-4px_rgba(44,24,16,0.08)] hover:shadow-[0_12px_40px_-8px_rgba(212,132,58,0.18)]",
        className
      )}
      onMouseEnter={() => {
        setIsHovered(true);
        addRecentlyViewed(product.id);
      }}
      onMouseMove={handleTiltMove}
      onMouseLeave={handleTiltLeave}
    >
      {/* 3D shine overlay */}
      <div className="tilt-shine" aria-hidden />

      {/* Image */}
      <div className="relative overflow-hidden aspect-[5/4] sm:aspect-square bg-gradient-to-b from-cream-100 to-cream-200">
        {/* Main Image */}
        <Image
          src={primaryImage?.url ?? "/images/brand/logo.png"}
          alt={primaryImage?.altText ?? product.name}
          fill
          className={cn(
            "object-cover transition-all duration-700 ease-out",
            isHovered && secondaryImage ? "opacity-0 scale-110" : "opacity-100 scale-100"
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {secondaryImage && (
          <Image
            src={secondaryImage.url}
            alt={secondaryImage.altText ?? product.name}
            fill
            className={cn(
              "object-cover transition-all duration-700 ease-out absolute inset-0",
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-110"
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}

        {/* Top gradient overlay for badges */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <Badge variant="destructive" className="text-[11px] px-2.5 py-0.5 font-bold">
              -{discount}%
            </Badge>
          )}
          {product.isBestseller && (
            <Badge variant="bestseller" className="text-[11px] px-2.5 py-0.5">
              Bestseller
            </Badge>
          )}
          {product.isNewArrival && (
            <Badge variant="new" className="text-[11px] px-2.5 py-0.5">
              New
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="secondary" className="text-[11px] px-2.5 py-0.5">
              Sold Out
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={handleWishlist}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-300",
              inWishlist
                ? "bg-spice-500 text-white scale-100"
                : "bg-white/80 text-gray-500 hover:text-spice-500 opacity-0 group-hover:opacity-100"
            )}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("w-4 h-4", inWishlist && "fill-current")} />
          </button>
        </div>

        {/* Quick Add button on hover */}
        {!isOutOfStock && (
          <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white transition-colors"
              style={{
                background: "linear-gradient(135deg, #D4843A 0%, #c26b1e 100%)",
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              Quick Add to Cart
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-5 flex-1 flex flex-col">
        {/* Category + Veg */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-brand-500/80 font-semibold uppercase tracking-[0.15em]">
            {product.category.name}
          </span>
          <VegIndicator isVeg={product.isVeg} />
        </div>

        {/* Name */}
        <h3 className="font-serif font-bold text-earth-dark text-sm sm:text-base leading-snug mb-2 line-clamp-1 sm:line-clamp-2 group-hover:text-brand-600 transition-colors duration-300">
          {product.name}
        </h3>

        {/* Rating */}
        {(product.avgRating ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3 h-3",
                    i < Math.round(product.avgRating ?? 0)
                      ? "fill-turmeric-500 text-turmeric-500"
                      : "fill-gray-200 text-gray-200"
                  )}
                />
              ))}
            </div>
            {(product.reviewCount ?? 0) > 0 && (
              <span className="text-[11px] text-gray-400">
                ({product.reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Variant selector */}
        {product.variants.length > 1 && !compact && (
          <div className="flex gap-1 sm:gap-1.5 mb-2 sm:mb-3 flex-wrap">
            {product.variants.map((v, i) => (
              <button
                key={v.id}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedVariantIdx(i);
                }}
                className={cn(
                  "text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border transition-all duration-200",
                  i === selectedVariantIdx
                    ? "border-brand-500 bg-brand-50 text-brand-700 font-semibold"
                    : "border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-500"
                )}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto pt-2 sm:pt-3 border-t border-brand-100/40 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif font-bold text-earth-dark text-base sm:text-lg">
              {formatCurrency(selectedVariant?.price ?? 0)}
            </span>
            {discount > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(selectedVariant?.mrp ?? 0)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-300",
              isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:shadow-brand active:scale-95"
            )}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {compact ? "" : "Add"}
          </button>
        </div>
      </div>
    </Link>
  );
}
