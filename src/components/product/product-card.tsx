"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useCallback } from "react";
import { Heart, ShoppingCart, Eye, Star } from "lucide-react";
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
      el.style.transform = `perspective(900px) rotateY(${x * 11}deg) rotateX(${-y * 11}deg) scale3d(1.03,1.03,1.03)`;
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
        "group relative bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover tilt-card flex flex-col",
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
      <div className="relative overflow-hidden aspect-square bg-cream-200">
        {/* Main Image */}
        <Image
          src={primaryImage?.url ?? "https://placehold.co/400x400/FDF8F0/D4843A?text=Magadh"}
          alt={primaryImage?.altText ?? product.name}
          fill
          className={cn(
            "object-cover transition-all duration-500",
            isHovered && secondaryImage ? "opacity-0 scale-105" : "opacity-100 scale-100"
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {/* Secondary Image on hover */}
        {secondaryImage && (
          <Image
            src={secondaryImage.url}
            alt={secondaryImage.altText ?? product.name}
            fill
            className={cn(
              "object-cover transition-all duration-500 absolute inset-0",
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-105"
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <Badge variant="destructive" className="text-[11px] px-2 py-0.5">
              -{discount}%
            </Badge>
          )}
          {product.isBestseller && (
            <Badge variant="bestseller" className="text-[11px] px-2 py-0.5">
              🔥 Bestseller
            </Badge>
          )}
          {product.isNewArrival && (
            <Badge variant="new" className="text-[11px] px-2 py-0.5">
              ✨ New
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleWishlist}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200",
              inWishlist
                ? "bg-spice-500 text-white"
                : "bg-white text-gray-500 hover:text-spice-500"
            )}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("w-4 h-4", inWishlist && "fill-current")} />
          </button>
        </div>

        {/* Quick Add button */}
        {!isOutOfStock && (
          <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-brand-600 hover:text-white hover:bg-brand-500 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Quick Add
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category + Veg */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-brand-500 font-medium uppercase tracking-wide">
            {product.category.name}
          </span>
          <VegIndicator isVeg={product.isVeg} />
        </div>

        {/* Name */}
        <h3 className="font-semibold text-earth-dark text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-brand-600 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {(product.avgRating ?? 0) > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 fill-turmeric-500 text-turmeric-500" />
            <span className="text-xs font-medium text-earth-dark">
              {product.avgRating?.toFixed(1)}
            </span>
            {(product.reviewCount ?? 0) > 0 && (
              <span className="text-xs text-gray-400">
                ({product.reviewCount})
              </span>
            )}
          </div>
        )}

        {/* Variant selector (compact) */}
        {product.variants.length > 1 && !compact && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {product.variants.map((v, i) => (
              <button
                key={v.id}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedVariantIdx(i);
                }}
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full border transition-all",
                  i === selectedVariantIdx
                    ? "border-brand-500 bg-brand-50 text-brand-600 font-medium"
                    : "border-gray-200 text-gray-500 hover:border-brand-300"
                )}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-earth-dark text-base">
              {formatCurrency(selectedVariant?.price ?? 0)}
            </span>
            {discount > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(selectedVariant?.mrp ?? 0)}
              </span>
            )}
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-brand-500 text-white hover:bg-brand-600 active:scale-95"
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
