"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Package, Minus, Plus, X, CreditCard, MapPin, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Step = "cart" | "shipping" | "payment" | "confirmation";

export default function CheckoutPage() {
  const cart = useStore((s) => s.cart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const updateCartQuantity = useStore((s) => s.updateCartQuantity);
  const placeOrder = useStore((s) => s.placeOrder);

  const [step, setStep] = useState<Step>("cart");
  const [orderId, setOrderId] = useState("");

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

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost = subtotal >= 999 ? 0 : 149;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shippingCost + tax;

  const handlePlaceOrder = () => {
    const fullName = `${shipping.firstName} ${shipping.lastName}`;
    const address = `${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zip}`;
    const order = placeOrder(fullName, shipping.email, address);
    if (order) {
      setOrderId(order.id);
      setStep("confirmation");
    }
  };

  const STEPS = [
    { id: "cart", label: "Cart", icon: Package },
    { id: "shipping", label: "Shipping", icon: MapPin },
    { id: "payment", label: "Payment", icon: CreditCard },
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
              Order Confirmed!
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Thank you, {shipping.firstName}. Your order has been placed successfully.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Order reference: <span className="font-semibold text-foreground">{orderId}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              A confirmation email has been sent to{" "}
              <span className="font-medium text-foreground">{shipping.email}</span>.
              Delivery is estimated within 7–14 business days.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop"
                className="bg-primary text-primary-foreground px-8 py-3 rounded font-medium hover:opacity-90 transition-opacity"
              >
                Continue Shopping
              </Link>
              <Link
                href="/"
                className="border border-border text-foreground px-8 py-3 rounded font-medium hover:bg-muted transition-colors"
              >
                Back to Home
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
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>

          <h1 className="font-serif text-4xl font-bold text-foreground mb-8">Checkout</h1>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Panel */}
            <div className="lg:col-span-2">
              {/* STEP 1: Cart Review */}
              {step === "cart" && (
                <div className="space-y-4">
                  <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
                    Review Your Cart
                  </h2>
                  {cart.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="font-serif text-xl text-foreground mb-4">Your cart is empty</p>
                      <Link href="/shop" className="text-accent hover:underline">
                        Browse our collection
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
                                aria-label="Remove item"
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
                                ${(item.product.price * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => setStep("shipping")}
                          disabled={cart.length === 0}
                          className="bg-primary text-primary-foreground px-8 py-3.5 rounded font-medium hover:opacity-90 transition-opacity"
                        >
                          Continue to Shipping
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
                    Shipping Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "firstName", label: "First Name", placeholder: "Jane", col: 1 },
                      { key: "lastName", label: "Last Name", placeholder: "Doe", col: 1 },
                      { key: "email", label: "Email Address", placeholder: "jane@example.com", col: 2 },
                      { key: "phone", label: "Phone Number", placeholder: "+1 (555) 000-0000", col: 2 },
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
                        Street Address
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
                      { key: "city", label: "City", placeholder: "San Francisco" },
                      { key: "state", label: "State", placeholder: "CA" },
                      { key: "zip", label: "ZIP Code", placeholder: "94102" },
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
                      onClick={() => setStep("cart")}
                      className="border border-border text-foreground px-6 py-3 rounded font-medium hover:bg-muted transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep("payment")}
                      className="flex-1 bg-primary text-primary-foreground py-3 rounded font-medium hover:opacity-90 transition-opacity"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Payment */}
              {step === "payment" && (
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
                    Payment Details
                  </h2>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-700 font-medium">Secure Checkout</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Your payment information is encrypted and never stored on our servers.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        placeholder="Jane Doe"
                        defaultValue={`${shipping.firstName} ${shipping.lastName}`.trim()}
                        className="w-full border border-input rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        className="w-full border border-input rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM / YY"
                          maxLength={7}
                          className="w-full border border-input rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          maxLength={4}
                          className="w-full border border-input rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={() => setStep("shipping")}
                      className="border border-border text-foreground px-6 py-3 rounded font-medium hover:bg-muted transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      className="flex-1 bg-accent text-accent-foreground py-3.5 rounded font-semibold hover:opacity-90 transition-opacity"
                    >
                      Place Order — ${total.toLocaleString()}
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
                    Order Summary
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
                        ${(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-5 border-t border-border space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground font-medium">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={shippingCost === 0 ? "text-green-600 font-medium" : "text-foreground font-medium"}>
                      {shippingCost === 0 ? "Free" : `$${shippingCost}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span className="text-foreground font-medium">${tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-border">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-xl text-foreground">${total.toLocaleString()}</span>
                  </div>
                </div>
                {subtotal < 999 && (
                  <div className="px-6 pb-5">
                    <p className="text-xs text-accent bg-accent/10 rounded-lg px-3 py-2.5">
                      Add ${(999 - subtotal).toLocaleString()} more to qualify for free shipping.
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
