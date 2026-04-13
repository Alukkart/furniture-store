"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Package,
  Minus,
  Plus,
  X,
  CreditCard,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/currency";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";
import { siteText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Step = "cart" | "shipping" | "payment" | "confirmation";

export default function CheckoutPage() {
  const { currentUser } = useAuth();
  const locale = usePreferences((s) => s.locale);
  const t = siteText[locale].checkout;
  const cart = useStore((s) => s.cart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const updateCartQuantity = useStore((s) => s.updateCartQuantity);
  const placeOrder = useStore((s) => s.placeOrder);

  const [step, setStep] = useState<Step>("cart");
  const [orderId, setOrderId] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });
  const [payment, setPayment] = useState({
    cardholder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 149;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shippingCost + tax;

  useEffect(() => {
    if (!currentUser) return;
    setShipping((current) => ({
      ...current,
      email: current.email || currentUser.email,
      firstName: current.firstName || currentUser.name.split(" ")[0] || current.firstName,
      lastName: current.lastName || currentUser.name.split(" ").slice(1).join(" "),
    }));
  }, [currentUser]);

  useEffect(() => {
    setPayment((current) => ({
      ...current,
      cardholder:
        current.cardholder ||
        [shipping.firstName, shipping.lastName].filter(Boolean).join(" "),
    }));
  }, [shipping.firstName, shipping.lastName]);

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[+\d\s\-()]{7,20}$/;
  const zipPattern = /^[A-Za-z0-9\s-]{3,12}$/;
  const cardholderPattern = /^.+\s.+$/;
  const cardNumberPattern = /^\d{16}$/;
  const expiryPattern = /^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/;
  const cvvPattern = /^\d{3,4}$/;

  const validateCartStep = () => {
    if (cart.length === 0) {
      setError(t.requiredCart);
      return false;
    }
    return true;
  };

  const validateShippingStep = () => {
    const fields = [
      shipping.firstName,
      shipping.lastName,
      shipping.email,
      shipping.phone,
      shipping.address,
      shipping.city,
      shipping.state,
      shipping.zip,
    ];
    if (fields.some((value) => !value.trim())) {
      setError(t.requiredShipping);
      return false;
    }
    if (!emailPattern.test(shipping.email.trim().toLowerCase())) {
      setError(t.invalidEmail);
      return false;
    }
    if (!phonePattern.test(shipping.phone.trim())) {
      setError(t.invalidPhone);
      return false;
    }
    if (!zipPattern.test(shipping.zip.trim())) {
      setError(t.invalidZip);
      return false;
    }
    return true;
  };

  const validatePaymentStep = () => {
    if (
      !payment.cardholder.trim() ||
      !payment.cardNumber.trim() ||
      !payment.expiry.trim() ||
      !payment.cvv.trim()
    ) {
      setError(t.requiredPayment);
      return false;
    }
    if (!cardholderPattern.test(payment.cardholder.trim())) {
      setError(t.invalidCardholder);
      return false;
    }
    if (!cardNumberPattern.test(payment.cardNumber.replace(/\s+/g, ""))) {
      setError(t.invalidCardNumber);
      return false;
    }
    if (!expiryPattern.test(payment.expiry.trim())) {
      setError(t.invalidExpiry);
      return false;
    }
    if (!cvvPattern.test(payment.cvv.trim())) {
      setError(t.invalidCvv);
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;
    setError(null);
    if (!validateCartStep() || !validateShippingStep() || !validatePaymentStep()) return;
    setIsPlacingOrder(true);

    const fullName = `${shipping.firstName} ${shipping.lastName}`;
    const address = `${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}`;
    const order = await placeOrder(fullName.trim(), shipping.email.trim().toLowerCase(), address);
    if (order) {
      setOrderId(order.id);
      setStep("confirmation");
    } else {
      setError(t.orderFailed);
    }
    setIsPlacingOrder(false);
  };

  const STEPS = [
    { id: "cart", label: t.cart, icon: Package },
    { id: "shipping", label: t.shipping, icon: MapPin },
    { id: "payment", label: t.payment, icon: CreditCard },
  ];

  if (step === "confirmation") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-serif text-4xl font-bold text-foreground mb-3">
              {t.confirmationTitle}
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-2">
              {t.confirmationThanks.replace("{name}", shipping.firstName)}
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              {t.confirmationReference} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              {t.confirmationEmail.replace("{email}", shipping.email)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop"
                className="bg-primary text-primary-foreground px-8 py-3 rounded font-medium hover:opacity-90 transition-opacity"
              >
                {t.continueShopping}
              </Link>
              <Link
                href="/"
                className="border border-border text-foreground px-8 py-3 rounded font-medium hover:bg-muted transition-colors"
              >
                {t.backHome}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Back link */}
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> {t.continueShopping}
          </Link>

          <h1 className="font-serif text-4xl font-bold text-foreground mb-8">{t.title}</h1>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-10">
            {STEPS.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    step === s.id
                      ? "bg-primary text-primary-foreground"
                      : STEPS.findIndex((x) => x.id === step) > idx
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <s.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="w-8 h-px bg-border" />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Panel */}
            <div className="lg:col-span-2">
              {/* STEP 1: Cart Review */}
              {step === "cart" && (
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
                    {t.reviewCart}
                  </h2>
                  {cart.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="font-serif text-xl text-foreground mb-4">{t.cartEmpty}</p>
                      <Link href="/shop" className="text-accent hover:underline">
                        {t.browseCollection}
                      </Link>
                    </div>
                  ) : (
                    <>
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex gap-5 p-5 bg-card border border-border rounded-lg"
                        >
                          <div className="relative w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-foreground">{item.product.name}</h3>
                                <p className="text-sm text-muted-foreground">{item.product.category}</p>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                aria-label={t.removeItem}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-1 border border-border rounded">
                                <button
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                  className="p-2 text-muted-foreground hover:text-foreground"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-3 text-sm font-medium text-foreground">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                  className="p-2 text-muted-foreground hover:text-foreground"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="font-semibold text-foreground">
                                {formatPrice(item.product.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => {
                            setError(null);
                            if (validateCartStep()) setStep("shipping");
                          }}
                          disabled={cart.length === 0}
                          className="bg-primary text-primary-foreground px-8 py-3.5 rounded font-medium hover:opacity-90 transition-opacity"
                        >
                          {t.continueToShipping}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* STEP 2: Shipping */}
              {step === "shipping" && (
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
                    {t.shippingInfo}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "firstName", label: t.firstName, placeholder: "Иванов", col: 1 },
                      { key: "lastName", label: t.lastName, placeholder: "Иван", col: 1 },
                      { key: "email", label: t.email, placeholder: "ivan@mail.com", col: 2 },
                      { key: "phone", label: t.phone, placeholder: "+7999 999 99 99", col: 2 },
                    ].map((f) => (
                      <div key={f.key} className={f.col === 2 ? "sm:col-span-2" : ""}>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {f.label}
                        </label>
                        <input
                          type={f.key === "email" ? "email" : "text"}
                          placeholder={f.placeholder}
                          value={shipping[f.key as keyof typeof shipping]}
                          onChange={(e) =>
                            setShipping((s) => ({ ...s, [f.key]: e.target.value }))
                          }
                          className="w-full border border-input rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    ))}

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {t.address}
                        </label>
                      <input
                        type="text"
                        placeholder="123 Main Street, Apt 4B"
                        value={shipping.address}
                        onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))}
                        className="w-full border border-input rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>

                      {[
                      { key: "city", label: t.city, placeholder: "San Francisco" },
                      { key: "state", label: t.state, placeholder: "CA" },
                      { key: "zip", label: t.zip, placeholder: "94102" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {f.label}
                        </label>
                        <input
                          type="text"
                          placeholder={f.placeholder}
                          value={shipping[f.key as keyof typeof shipping]}
                          onChange={(e) =>
                            setShipping((s) => ({ ...s, [f.key]: e.target.value }))
                          }
                          className="w-full border border-input rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => {
                        setError(null);
                        setStep("cart");
                      }}
                      className="border border-border text-foreground px-6 py-3 rounded font-medium hover:bg-muted transition-colors"
                    >
                      {t.back}
                    </button>
                    <button
                      onClick={() => {
                        setError(null);
                        if (validateShippingStep()) setStep("payment");
                      }}
                      className="flex-1 bg-primary text-primary-foreground py-3 rounded font-medium hover:opacity-90 transition-opacity"
                    >
                      {t.continueToPayment}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Payment */}
              {step === "payment" && (
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
                    {t.paymentDetails}
                  </h2>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-700 font-medium">{t.secureCheckout}</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {t.secureCheckoutHint}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {t.cardholder}
                        </label>
                      <input
                        type="text"
                        placeholder="Jane Doe"
                        value={payment.cardholder}
                        onChange={(e) => setPayment((current) => ({ ...current, cardholder: e.target.value }))}
                        className="w-full border border-input rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {t.cardNumber}
                        </label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        value={payment.cardNumber}
                        onChange={(e) =>
                          setPayment((current) => ({
                            ...current,
                            cardNumber: e.target.value.replace(/[^\d\s]/g, ""),
                          }))
                        }
                        className="w-full border border-input rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {t.expiry}
                        </label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        maxLength={7}
                        value={payment.expiry}
                        onChange={(e) => setPayment((current) => ({ ...current, expiry: e.target.value }))}
                        className="w-full border border-input rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {t.cvv}
                        </label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        value={payment.cvv}
                        onChange={(e) =>
                          setPayment((current) => ({
                            ...current,
                            cvv: e.target.value.replace(/\D/g, ""),
                          }))
                        }
                        className="w-full border border-input rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => {
                        setError(null);
                        setStep("shipping");
                      }}
                      className="border border-border text-foreground px-6 py-3 rounded font-medium hover:bg-muted transition-colors"
                    >
                      {t.back}
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder || cart.length === 0}
                      className="flex-1 bg-accent text-accent-foreground py-3.5 rounded font-semibold hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isPlacingOrder
                        ? t.placingOrder
                        : `${t.placeOrder} — ${formatPrice(total)}`}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <aside className="lg:sticky lg:top-24 self-start">
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                    <h3 className="font-serif text-lg font-semibold text-foreground">
                    {t.orderSummary}
                  </h3>
                </div>
                <div className="px-6 py-5 space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted text-xs flex items-center justify-center font-medium text-foreground">
                          {item.quantity}
                        </span>
                        <span className="text-sm text-foreground truncate">
                          {item.product.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground flex-shrink-0">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-5 border-t border-border space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.subtotal}</span>
                    <span className="text-foreground font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.shippingCost}</span>
                    <span className={shippingCost === 0 ? "text-green-600 font-medium" : "text-foreground font-medium"}>
                      {shippingCost === 0 ? t.free : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.tax}</span>
                    <span className="text-foreground font-medium">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-border">
                    <span className="font-semibold text-foreground">{t.total}</span>
                    <span className="font-bold text-xl text-foreground">{formatPrice(total)}</span>
                  </div>
                </div>
                {subtotal < FREE_SHIPPING_THRESHOLD && (
                  <div className="px-6 pb-5">
                    <p className="text-xs text-accent bg-accent/10 rounded-lg px-3 py-2.5">
                      {t.freeShippingHint.replace("{amount}", formatPrice(FREE_SHIPPING_THRESHOLD - subtotal))}
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
