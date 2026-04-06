"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ShoppingCart,
  Heart,
  Share2,
  ChevronRight,
  Check,
  AlertCircle,
  Truck,
  RotateCcw,
  Shield,
  MapPin,
} from "lucide-react";
import { ProductGallery } from "@/components/product/product-gallery";
import { SpiceMeter } from "@/components/product/spice-meter";
import { ProductGrid } from "@/components/product/product-grid";
import { Rating, RatingBar } from "@/components/ui/rating";
import { Badge, VegIndicator } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useUIStore } from "@/store/ui-store";
import { cn, formatCurrency, calculateDiscount, isValidPincode } from "@/lib/utils";
import type { ProductCardData } from "@/types";
import type { Product, ProductVariant, ProductImage, Category, Review, User } from "@prisma/client";

type ProductWithDetails = Product & {
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
  reviews: (Review & { user: Pick<User, "id" | "name" | "image"> })[];
};

interface Props {
  product: ProductWithDetails;
  relatedProducts: ProductCardData[];
  avgRating: number;
}

export function ProductDetailClient({ product, relatedProducts, avgRating }: Props) {
  const { data: session } = useSession();
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "ingredients" | "nutrition" | "reviews">("description");
  const [pincode, setPincode] = useState("");
  const [pincodeMsg, setPincodeMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  const { addItem, setOpen } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addToast } = useUIStore();

  const selectedVariant = product.variants[selectedVariantIdx];
  const inWishlist = isInWishlist(product.id);
  const discount = selectedVariant
    ? calculateDiscount(selectedVariant.mrp, selectedVariant.price)
    : 0;
  const isOutOfStock = !selectedVariant || selectedVariant.stock <= 0;
  const isLowStock = !isOutOfStock && selectedVariant.stock <= selectedVariant.lowStockAlert;

  // Rating distribution
  const ratingDist = [5, 4, 3, 2, 1].map((star) => {
    const count = product.reviews.filter((r) => r.rating === star).length;
    return {
      star,
      count,
      percentage: product.reviews.length > 0 ? (count / product.reviews.length) * 100 : 0,
    };
  });

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return;

    const primaryImage = product.images.find((i) => i.isPrimary) ?? product.images[0];

    addItem({
      id: `${product.id}-${selectedVariant.id}`,
      cartId: "",
      productId: product.id,
      variantId: selectedVariant.id,
      quantity,
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
        sku: selectedVariant.sku,
      },
    });

    addToast({ type: "success", message: `Added ${product.name} to cart!` });
    setOpen(true);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Navigate to checkout
    window.location.href = "/checkout";
  };

  const checkPincode = async () => {
    if (!isValidPincode(pincode)) {
      setPincodeMsg({ type: "error", msg: "Enter a valid 6-digit pincode" });
      return;
    }
    setCheckingPincode(true);
    try {
      const res = await fetch(`/api/pincode?pincode=${pincode}`);
      const data = await res.json();
      if (data.success && data.data.isActive) {
        setPincodeMsg({
          type: "success",
          msg: `Delivers to ${data.data.city}, ${data.data.state} in ${data.data.deliveryDays} days`,
        });
      } else {
        setPincodeMsg({ type: "error", msg: "Delivery not available at this pincode" });
      }
    } catch {
      setPincodeMsg({ type: "error", msg: "Unable to check at this time" });
    } finally {
      setCheckingPincode(false);
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-cream-100 border-b border-gray-100">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/products" className="hover:text-brand-600">Products</Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-brand-600"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-earth-dark font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* Left: Gallery */}
          <div>
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right: Info */}
          <div className="space-y-6">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <VegIndicator isVeg={product.isVeg} />
              {product.isBestseller && (
                <Badge variant="bestseller">🔥 Bestseller</Badge>
              )}
              {product.isNewArrival && (
                <Badge variant="new">✨ New Arrival</Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {product.category.name}
              </Badge>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-earth-dark leading-tight">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Rating */}
            {product.reviews.length > 0 && (
              <Rating
                value={avgRating}
                showValue
                showCount={product.reviews.length}
                size="md"
              />
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-earth-dark">
                {formatCurrency(selectedVariant?.price ?? 0)}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {formatCurrency(selectedVariant.mrp)}
                  </span>
                  <Badge variant="destructive" className="text-sm px-2.5 py-1">
                    Save {discount}%
                  </Badge>
                </>
              )}
            </div>
            {isLowStock && (
              <p className="text-amber-600 text-sm font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Only {selectedVariant.stock} left in stock!
              </p>
            )}

            {/* Spice Level */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">Spice Level:</span>
              <SpiceMeter level={product.spiceLevel} size="md" />
            </div>

            {/* Variant Selector */}
            {product.variants.length > 1 && (
              <div>
                <p className="text-sm font-medium text-earth-dark mb-2.5">
                  Size / Weight
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v, i) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantIdx(i)}
                      className={cn(
                        "px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                        i === selectedVariantIdx
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : v.stock === 0
                            ? "border-gray-100 text-gray-300 bg-gray-50 relative overflow-hidden"
                            : "border-gray-200 text-earth-dark hover:border-brand-300 hover:bg-brand-50"
                      )}
                    >
                      {v.name}
                      {v.stock === 0 && (
                        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gray-300 rotate-[140deg]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Actions */}
            <div className="space-y-3">
              {/* Quantity */}
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-earth-dark">Quantity:</p>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-earth-dark hover:bg-gray-50 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-medium text-earth-dark">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(10, selectedVariant?.stock ?? 10, quantity + 1))
                    }
                    className="w-10 h-10 flex items-center justify-center text-earth-dark hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  variant="outline"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  variant="premium"
                >
                  Buy Now
                </Button>
                <Button
                  size="lg"
                  variant={inWishlist ? "default" : "outline"}
                  onClick={() => {
                    toggleWishlist(product.id);
                    addToast({
                      type: inWishlist ? "info" : "success",
                      message: inWishlist
                        ? "Removed from wishlist"
                        : "Added to wishlist!",
                    });
                  }}
                  className="shrink-0"
                  aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart
                    className={cn("w-4 h-4", inWishlist && "fill-current")}
                  />
                </Button>
              </div>

              {isOutOfStock && (
                <p className="text-center text-sm text-gray-400">
                  Currently out of stock. We&apos;ll notify you when available.
                </p>
              )}
            </div>

            {/* Pincode Checker */}
            <div className="bg-cream-100 rounded-xl p-4 border border-cream-300">
              <p className="text-sm font-medium text-earth-dark mb-2.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-500" />
                Check Delivery Availability
              </p>
              <div className="flex gap-2">
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/, "").slice(0, 6))}
                  placeholder="Enter pincode"
                  className="flex-1 h-9"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkPincode}
                  loading={checkingPincode}
                >
                  Check
                </Button>
              </div>
              {pincodeMsg && (
                <p
                  className={cn(
                    "text-xs mt-2 flex items-center gap-1",
                    pincodeMsg.type === "success" ? "text-green-600" : "text-spice-600"
                  )}
                >
                  {pincodeMsg.type === "success" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  {pincodeMsg.msg}
                </p>
              )}
            </div>

            {/* Delivery Info */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: "Free Delivery", sub: "Above ₹499" },
                { icon: RotateCcw, label: "Easy Returns", sub: "7-day policy" },
                { icon: Shield, label: "Secure", sub: "100% Safe" },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex flex-col items-center text-center bg-cream-100 rounded-xl p-3 gap-1.5"
                >
                  <Icon className="w-4 h-4 text-brand-500" />
                  <p className="text-xs font-semibold text-earth-dark">{label}</p>
                  <p className="text-[11px] text-gray-500">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-14">
          {/* Tab headers */}
          <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
            {(
              [
                { key: "description", label: "Description" },
                { key: "ingredients", label: "Ingredients" },
                { key: "nutrition", label: "Nutrition" },
                { key: "reviews", label: `Reviews (${product.reviews.length})` },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                  activeTab === key
                    ? "text-brand-600 border-brand-500"
                    : "text-gray-500 border-transparent hover:text-earth-dark hover:border-gray-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="py-8">
            {activeTab === "description" && (
              <div className="prose-brand max-w-3xl space-y-4">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : (
                  <p>No description available.</p>
                )}
                {product.storageInstructions && (
                  <div>
                    <h3 className="font-serif font-semibold text-earth-dark text-base mb-2">
                      🏺 Storage Instructions
                    </h3>
                    <p className="text-sm text-gray-600">{product.storageInstructions}</p>
                  </div>
                )}
                {product.shelfLife && (
                  <p className="text-sm text-gray-600">
                    <strong>Shelf Life:</strong> {product.shelfLife}
                  </p>
                )}
                {product.usageSuggestions && (
                  <div>
                    <h3 className="font-serif font-semibold text-earth-dark text-base mb-2">
                      💡 Usage Suggestions
                    </h3>
                    <p className="text-sm text-gray-600">{product.usageSuggestions}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ingredients" && (
              <div className="max-w-2xl">
                {product.ingredients ? (
                  <div className="bg-cream-100 rounded-2xl p-6">
                    <h3 className="font-serif font-semibold text-earth-dark mb-4">
                      🌿 Ingredients
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {product.ingredients}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Ingredients information not available.</p>
                )}
              </div>
            )}

            {activeTab === "nutrition" && (
              <div className="max-w-md">
                {product.nutritionInfo ? (
                  <div className="bg-cream-100 rounded-2xl p-6">
                    <h3 className="font-serif font-semibold text-earth-dark mb-4">
                      📊 Nutritional Information
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {product.nutritionInfo}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Nutritional information not available.</p>
                )}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="max-w-3xl space-y-8">
                {product.reviews.length > 0 ? (
                  <>
                    {/* Rating Summary */}
                    <div className="bg-cream-100 rounded-2xl p-6">
                      <RatingBar
                        distribution={ratingDist}
                        total={product.reviews.length}
                        average={avgRating}
                      />
                    </div>

                    {/* Individual Reviews */}
                    <div className="space-y-5">
                      {product.reviews.map((review) => (
                        <div
                          key={review.id}
                          className="bg-white border border-gray-100 rounded-2xl p-5 shadow-card"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm shrink-0">
                              {review.user.name?.[0]?.toUpperCase() ?? "U"}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-earth-dark text-sm">
                                  {review.user.name ?? "Anonymous"}
                                </p>
                                {review.isVerified && (
                                  <span className="text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    ✓ Verified Purchase
                                  </span>
                                )}
                              </div>
                              <Rating value={review.rating} size="sm" className="mt-0.5" />
                            </div>
                          </div>
                          {review.title && (
                            <p className="font-semibold text-sm text-earth-dark mb-1">
                              {review.title}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 leading-relaxed">{review.body}</p>
                          <p className="text-xs text-gray-400 mt-3">
                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No reviews yet.</p>
                    {session && (
                      <p className="text-sm mt-2 text-brand-600">
                        Be the first to review this product!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-14 pt-10 border-t border-gray-100">
            <h2 className="font-serif text-2xl font-bold text-earth-dark mb-6">
              You Might Also Like
            </h2>
            <ProductGrid products={relatedProducts} />
          </div>
        )}
      </div>
    </div>
  );
}
