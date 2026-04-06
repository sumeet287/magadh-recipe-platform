"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const {
    items,
    subtotal,
    discount,
    coupon,
    couponDiscount,
    shippingCharge,
    taxAmount,
    total,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleCouponApply = async () => {
    if (!couponInput.trim()) return;
    setCouponError(null);
    setCouponLoading(true);
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput.trim().toUpperCase(), subtotal }),
    });
    const data = await res.json();
    setCouponLoading(false);

    if (!res.ok || !data.success) {
      setCouponError(data.message ?? "Invalid coupon");
      return;
    }

    applyCoupon(data.data);
    setCouponInput("");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4">
        <ShoppingBag className="w-16 h-16 text-gray-300" />
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-earth-dark">Your cart is empty</h1>
          <p className="text-gray-500 mt-2">Looks like you haven&apos;t added anything yet.</p>
        </div>
        <Link href="/products">
          <Button variant="premium" size="lg">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-12">
        <h1 className="font-serif text-2xl font-bold text-earth-dark mb-8">
          Shopping Cart ({items.length})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-card p-4 flex gap-4"
              >
                {item.product.image && (
                  <Link href={`/products/${item.product.slug}`}>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 rounded-xl object-cover border border-gray-100 hover:opacity-90"
                    />
                  </Link>
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`}>
                    <p className="font-semibold text-earth-dark text-sm hover:text-brand-600 truncate">
                      {item.product.name}
                    </p>
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{item.variant.name}</p>
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    {/* Quantity */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, Math.min(10, item.variant.stock, item.quantity + 1))}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="font-bold text-earth-dark">
                        {formatCurrency(item.variant.price * item.quantity)}
                      </p>
                      {item.variant.mrp > item.variant.price && (
                        <p className="text-xs text-gray-400 line-through">
                          {formatCurrency(item.variant.mrp * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 text-gray-400 hover:text-spice-600 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <p className="font-semibold text-sm text-earth-dark mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-500" />
                Coupon Code
              </p>
              {coupon ? (
                <div className="flex items-center justify-between bg-brand-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-brand-700">{coupon.code}</p>
                    <p className="text-xs text-brand-600">
                      − {formatCurrency(couponDiscount)} saved
                    </p>
                  </div>
                  <button onClick={removeCoupon} className="text-gray-400 hover:text-spice-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                    placeholder="Enter code"
                    className="flex-1 h-9 text-sm"
                    error={couponError ?? undefined}
                    onKeyDown={(e) => e.key === "Enter" && handleCouponApply()}
                  />
                  <Button size="sm" variant="outline" onClick={handleCouponApply} loading={couponLoading}>
                    Apply
                  </Button>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h2 className="font-semibold text-earth-dark mb-4">Order Summary</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Product Discount</span>
                    <span>− {formatCurrency(discount)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({coupon?.code})</span>
                    <span>− {formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shippingCharge === 0 ? "FREE" : formatCurrency(shippingCharge)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST 5%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-base text-earth-dark">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {shippingCharge > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  Add {formatCurrency(499 - subtotal)} more for free shipping
                </p>
              )}

              <Link href="/checkout" className="block mt-5">
                <Button size="lg" variant="premium" className="w-full">
                  Proceed to Checkout
                </Button>
              </Link>

              <Link href="/products" className="block mt-3">
                <Button size="lg" variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
