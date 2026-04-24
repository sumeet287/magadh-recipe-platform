"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, MapPin, CreditCard, ShoppingBag, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/lib/utils";
import { addressShape, type CheckoutInput } from "@/lib/validations/order";
import { INDIAN_STATES_AND_UTS } from "@/lib/constants";
import { z } from "zod";

const addressFormSchema = z.object({ address: addressShape });
import type { Address } from "@prisma/client";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name?: string; email?: string; contact?: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

type Step = "address" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "address", label: "Address" },
  { key: "review", label: "Review & Pay" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, subtotal, discount, coupon, couponDiscount, shippingCharge, taxAmount, total, clearCart } = useCartStore();

  const [step, setStep] = useState<Step>("address");
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const paymentMethod = "RAZORPAY" as const;
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<{ address: CheckoutInput["address"] }>({
    resolver: zodResolver(addressFormSchema),
  });

  useEffect(() => {
    if (!session) return;
    fetch("/api/users/addresses")
      .then((r) => r.json())
      .then((d) => {
        const addrs: Address[] = d.data ?? [];
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.isDefault);
        if (def) setSelectedAddressId(def.id);
        else if (addrs.length > 0) setSelectedAddressId(addrs[0].id);
        else setUseNewAddress(true);
      });
  }, [session]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <ShoppingBag className="w-14 h-14 text-gray-300" />
        <p className="text-gray-500">No items in cart.</p>
        <Link href="/products"><Button variant="premium">Shop Now</Button></Link>
      </div>
    );
  }

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);

  const getAddressForOrder = (formData: Partial<CheckoutInput>): CheckoutInput["address"] | null => {
    if (!useNewAddress && selectedAddress) {
      return {
        name: selectedAddress.name,
        phone: selectedAddress.phone,
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2 ?? undefined,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        country: selectedAddress.country ?? "India",
      };
    }
    return formData.address ?? null;
  };

  const placeOrder = async (addressData: CheckoutInput["address"]) => {
    setError(null);
    setProcessing(true);

    if (!addressData) {
      setError("Delivery address is required");
      setProcessing(false);
      return;
    }

    // Create order
    const orderRes = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        address: addressData,
        couponCode: coupon?.code,
        paymentMethod,
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      setError(orderData.message ?? "Failed to create order");
      setProcessing(false);
      return;
    }

    const order = orderData.data;

    // Razorpay
    const razorRes = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });
    const razorData = await razorRes.json();
    if (!razorRes.ok) {
      setError("Payment gateway error. Please try again.");
      setProcessing(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: razorData.data.amount,
      currency: "INR",
      name: "Magadh Recipe",
      description: `Order #${order.orderNumber}`,
      order_id: razorData.data.razorpayOrderId,
      handler: async (response) => {
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...response, orderId: order.id }),
        });
        if (verifyRes.ok) {
          clearCart();
          router.push(`/checkout/success?orderId=${order.id}`);
        } else {
          setError("Payment verification failed. Contact support.");
          setProcessing(false);
        }
      },
      prefill: {
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        contact: addressData.phone,
      },
      theme: { color: "#f97316" },
      modal: { ondismiss: () => setProcessing(false) },
    });
    rzp.open();
  };

  const onAddressSubmit = () => {
    setStep("review");
  };

  return (
    <div className="bg-cream-50">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-5 sm:py-8">
        {/* Steps */}
        <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 sm:gap-3">
              <div
                className={`flex items-center gap-2 text-sm sm:text-base font-medium cursor-pointer
                  ${step === s.key ? "text-brand-600" : i < STEPS.findIndex((x) => x.key === step) ? "text-green-600" : "text-gray-400"}
                `}
                onClick={() => {
                  if (i < STEPS.findIndex((x) => x.key === step)) setStep(s.key);
                }}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${step === s.key ? "bg-brand-500 text-white" : i < STEPS.findIndex((x) => x.key === step) ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}
                `}>
                  {i + 1}
                </span>
                {s.label}
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
          {/* Left: Steps */}
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {step === "address" && (
              <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
                <h2 className="font-serif font-bold text-earth-dark text-xl mb-5 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-500" /> Delivery Address
                </h2>

                {savedAddresses.length > 0 && !useNewAddress && (
                  <div className="space-y-3 mb-5">
                    {savedAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all
                          ${selectedAddressId === addr.id ? "border-brand-400 bg-brand-50 shadow-sm" : "border-gray-100 hover:border-gray-200"}
                        `}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-0.5"
                        />
                        <div className="leading-snug">
                          <p className="font-semibold text-base text-earth-dark">{addr.name} <span className="text-xs text-gray-400 capitalize">({addr.type.toLowerCase()})</span></p>
                          <p className="text-sm text-gray-600 mt-0.5">{addr.addressLine1}, {addr.city}, {addr.state} – {addr.pincode}</p>
                          <p className="text-gray-500 text-sm mt-0.5">{addr.phone}</p>
                        </div>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => setUseNewAddress(true)}
                      className="flex items-center gap-2 text-sm text-brand-600 font-medium hover:text-brand-700 mt-1"
                    >
                      <Plus className="w-4 h-4" /> Add New Address
                    </button>
                  </div>
                )}

                {(useNewAddress || savedAddresses.length === 0) && (
                  <form id="address-form" onSubmit={handleSubmit(onAddressSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Full Name" error={errors.address?.name?.message} {...register("address.name")} />
                      <Input label="Phone" type="tel" error={errors.address?.phone?.message} {...register("address.phone")} />
                    </div>
                    <Input label="Address Line 1" error={errors.address?.addressLine1?.message} {...register("address.addressLine1")} />
                    <Input label="Address Line 2 (optional)" {...register("address.addressLine2")} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="City" error={errors.address?.city?.message} {...register("address.city")} />
                      <Input label="Pincode" error={errors.address?.pincode?.message} {...register("address.pincode")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-earth-dark mb-1.5">State</label>
                      <select {...register("address.state")} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                        <option value="">Select state</option>
                        {INDIAN_STATES_AND_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    {savedAddresses.length > 0 && (
                      <button type="button" onClick={() => setUseNewAddress(false)} className="text-sm text-gray-500 hover:text-earth-dark">
                        ← Use saved address
                      </button>
                    )}
                  </form>
                )}

                <div className="mt-5">
                  {useNewAddress || savedAddresses.length === 0 ? (
                    <Button type="submit" form="address-form" size="lg" className="w-full text-base">
                      Continue to Review
                    </Button>
                  ) : (
                    <Button onClick={() => setStep("review")} size="lg" className="w-full text-base" disabled={!selectedAddressId}>
                      Continue to Review
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Review & Pay */}
            {step === "review" && (
              <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6">
                <h2 className="font-serif font-bold text-earth-dark text-xl mb-5">Review & Place Order</h2>

                {error && (
                  <div className="text-sm text-spice-700 bg-spice-50 border border-spice-200 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Delivery to */}
                <div className="mb-5 p-4 bg-cream-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-brand-500" />
                    <p className="font-semibold text-earth-dark text-sm">Delivering to:</p>
                  </div>
                  {selectedAddress && !useNewAddress ? (
                    <div className="text-gray-600 text-sm leading-relaxed">
                      <p className="font-medium text-earth-dark">{selectedAddress.name}</p>
                      <p>{selectedAddress.addressLine1}</p>
                      <p>{selectedAddress.city}, {selectedAddress.state} – {selectedAddress.pincode}</p>
                      <p className="text-gray-500 text-xs mt-1">{selectedAddress.phone}</p>
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">{getValues("address.name")}, {getValues("address.addressLine1")}, {getValues("address.city")}</p>
                  )}
                </div>

                {/* Payment method */}
                <div className="mb-5 p-4 bg-cream-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-brand-500" />
                    <p className="font-semibold text-earth-dark text-sm">Payment:</p>
                  </div>
                  <p className="text-gray-600 text-sm">Online Payment — UPI, Card, Net Banking (Razorpay)</p>
                </div>

                {/* Items summary with images */}
                <div className="mb-5">
                  <p className="font-semibold text-earth-dark text-sm mb-3">Items ({items.length})</p>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center p-3 bg-gray-50 rounded-xl">
                        {item.product.image && (
                          <img src={item.product.image} alt="" className="w-14 h-14 rounded-lg object-cover border border-gray-100 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-earth-dark truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.variant.name} × {item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold text-earth-dark shrink-0">{formatCurrency(item.variant.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price summary inline */}
                <div className="mb-5 p-4 border border-gray-100 rounded-xl space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Coupon</span><span>− {formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span><span>{shippingCharge === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatCurrency(shippingCharge)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2.5 flex justify-between font-bold text-base text-earth-dark">
                    <span>Total</span>
                    <span className="text-brand-600">{formatCurrency(total)}</span>
                  </div>
                  <p className="text-xs text-gray-400 text-right">Incl. GST {formatCurrency(taxAmount)}{discount > 0 && <> · You save {formatCurrency(discount)} on MRP</>}</p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("address")}>Back</Button>
                  <Button
                    variant="premium"
                    size="lg"
                    className="flex-1 text-base"
                    loading={processing}
                    onClick={() => {
                      const addr = getAddressForOrder(getValues());
                      if (!addr) { setError("Please select or enter a delivery address."); return; }
                      placeOrder(addr);
                    }}
                  >
                    Pay & Place Order — {formatCurrency(total)}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary */}
          <div className="bg-white rounded-2xl shadow-card p-5 sm:p-6 h-fit">
            <h3 className="font-semibold text-earth-dark text-lg mb-4">Order Summary</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  {item.product.image && (
                    <img src={item.product.image} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-earth-dark font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.variant.name} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{formatCurrency(item.variant.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coupon</span><span>− {formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shippingCharge === 0 ? <span className="text-green-600 font-medium">FREE</span> : formatCurrency(shippingCharge)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-base text-earth-dark">
                <span>Total</span>
                <span className="text-brand-600">{formatCurrency(total)}</span>
              </div>
              <p className="text-xs text-gray-400 text-right">Incl. GST {formatCurrency(taxAmount)}{discount > 0 && <> · You save {formatCurrency(discount)}</>}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
