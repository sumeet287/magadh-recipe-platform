"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Gift } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export function CartDrawer() {
  const {
    items,
    isOpen,
    setOpen,
    removeItem,
    updateQuantity,
    subtotal,
    couponDiscount,
    shippingCharge,
    total,
    itemCount,
  } = useCartStore();

  const progress =
    shippingCharge > 0
      ? Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)
      : 100;
  const amountForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-500" />
            <h2 className="font-serif font-semibold text-earth-dark text-lg">
              Your Cart
            </h2>
            {itemCount > 0 && (
              <span className="bg-brand-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {subtotal > 0 && (
          <div className="px-6 py-3 bg-cream-100 border-b border-brand-100">
            {amountForFreeShipping > 0 ? (
              <p className="text-xs text-earth-700 mb-2">
                Add{" "}
                <strong className="text-brand-600">
                  {formatCurrency(amountForFreeShipping)}
                </strong>{" "}
                more for{" "}
                <strong className="text-green-600">FREE delivery</strong>! 🚚
              </p>
            ) : (
              <p className="text-xs text-green-700 font-medium mb-2">
                🎉 You&apos;ve unlocked FREE delivery!
              </p>
            )}
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-gradient rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5">
              <div className="w-24 h-24 rounded-full bg-cream-200 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-brand-300" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-earth-dark text-lg mb-1">
                  Your cart is empty
                </h3>
                <p className="text-sm text-gray-500">
                  Add some delicious pickles and masalas!
                </p>
              </div>
              <Button
                onClick={() => setOpen(false)}
                asChild
                variant="premium"
              >
                <Link href="/products">
                  Explore Products <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
                  {/* Product Image */}
                  <Link
                    href={`/products/${item.product.slug}`}
                    onClick={() => setOpen(false)}
                    className="shrink-0"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-cream-200 border border-gray-100">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🥫
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={() => setOpen(false)}
                      className="font-medium text-earth-dark text-sm hover:text-brand-600 transition-colors line-clamp-2 leading-snug"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{item.variant.name}</p>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          className="w-7 h-7 flex items-center justify-center text-earth-dark hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-earth-dark">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.variant.stock}
                          className="w-7 h-7 flex items-center justify-center text-earth-dark hover:bg-brand-50 hover:text-brand-600 transition-colors disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price + Remove */}
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm text-earth-dark">
                          {formatCurrency(item.variant.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="text-gray-300 hover:text-spice-500 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 bg-cream-100 px-6 py-5 space-y-4">
            {/* Price Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-earth-700">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-earth-700">
                <span>Delivery</span>
                <span className={shippingCharge === 0 ? "text-green-600 font-medium" : ""}>
                  {shippingCharge === 0 ? "FREE" : formatCurrency(shippingCharge)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-earth-dark pt-2 border-t border-gray-200 text-base">
                <span>Total</span>
                <span className="text-brand-600">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Gift Note */}
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white rounded-lg p-2.5 border border-gray-100">
              <Gift className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>Add gift message at checkout</span>
            </div>

            {/* CTA */}
            <Button
              className="w-full"
              size="lg"
              variant="premium"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link href="/checkout">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full text-sm text-gray-500"
              onClick={() => setOpen(false)}
              asChild
            >
              <Link href="/cart">View Full Cart</Link>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
