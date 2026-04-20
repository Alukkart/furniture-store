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
import {
  formatCardExpiry,
  formatCardNumber,
  formatRussianPhone,
  isValidCardExpiry,
  isValidCardNumber,
  isValidCardholderName,
  isValidCvv,
  isValidEmail,
  isValidRussianAddress,
  isValidRussianLocation,
  isValidRussianPersonalName,
  isValidRussianPhone,
  isValidRussianPostalCode,
  normalizeCvv,
  normalizeEmail,
  normalizeRussianAddress,
  normalizeRussianLocation,
  normalizeRussianName,
  normalizeRussianPostalCode,
  sanitizeCardholderNameInput,
  sanitizeRussianAddressInput,
  sanitizeRussianLocationInput,
  sanitizeRussianNameInput,
} from "@/lib/validation";

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
    country: "Россия",
  });
  const [payment, setPayment] = useState({
    cardholder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [shippingErrors, setShippingErrors] = useState<Partial<Record<keyof typeof shipping, string>>>({});
  const [paymentErrors, setPaymentErrors] = useState<Partial<Record<keyof typeof payment, string>>>({});
  const russianNameMessage = locale === "ru" ? "Введите имя или фамилию кириллицей." : "Enter the name in Cyrillic.";

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 149;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shippingCost + tax;

  useEffect(() => {
    if (!currentUser) return;
    setShipping((current) => ({
      ...current,
      email: current.email || currentUser.email,
      firstName: current.firstName || sanitizeRussianNameInput(currentUser.name.split(" ")[0] || current.firstName),
      lastName: current.lastName || sanitizeRussianNameInput(currentUser.name.split(" ").slice(1).join(" ")),
    }));
  }, [currentUser]);

  useEffect(() => {
    setPayment((current) => ({
      ...current,
      cardholder:
        current.cardholder ||
        sanitizeCardholderNameInput([shipping.firstName, shipping.lastName].filter(Boolean).join(" ")),
    }));
  }, [shipping.firstName, shipping.lastName]);

  const validateCartStep = () => {
    if (cart.length === 0) {
      setError(t.requiredCart);
      return false;
    }
    return true;
  };

  const validateShippingStep = () => {
    const nextErrors: typeof shippingErrors = {};

    if (!shipping.firstName.trim() || !isValidRussianPersonalName(shipping.firstName)) nextErrors.firstName = russianNameMessage;
    if (!shipping.lastName.trim() || !isValidRussianPersonalName(shipping.lastName)) nextErrors.lastName = russianNameMessage;
    if (!shipping.email.trim()) nextErrors.email = t.requiredShipping;
    else if (!isValidEmail(shipping.email)) nextErrors.email = t.invalidEmail;
    if (!shipping.phone.trim()) nextErrors.phone = t.requiredShipping;
    else if (!isValidRussianPhone(shipping.phone)) nextErrors.phone = t.invalidPhone;
    if (!shipping.address.trim()) nextErrors.address = t.requiredShipping;
    else if (!isValidRussianAddress(shipping.address)) nextErrors.address = locale === "ru" ? "Введите адрес в российском формате: улица, дом, квартира." : "Enter a Russian-style street address with house number.";
    if (!shipping.city.trim() || !isValidRussianLocation(shipping.city)) nextErrors.city = locale === "ru" ? "Введите город кириллицей." : "Enter the city in Cyrillic.";
    if (!shipping.state.trim() || !isValidRussianLocation(shipping.state)) nextErrors.state = locale === "ru" ? "Введите регион кириллицей." : "Enter the region in Cyrillic.";
    if (!shipping.zip.trim()) nextErrors.zip = t.requiredShipping;
    else if (!isValidRussianPostalCode(shipping.zip)) nextErrors.zip = t.invalidZip;

    if (Object.keys(nextErrors).length > 0) {
      setShippingErrors(nextErrors);
      setError(Object.values(nextErrors)[0] ?? t.requiredShipping);
      return false;
    }

    setShippingErrors({});
    return true;
  };

  const validatePaymentStep = () => {
    const nextErrors: typeof paymentErrors = {};

    if (!payment.cardholder.trim()) nextErrors.cardholder = t.requiredPayment;
    else if (!isValidCardholderName(payment.cardholder)) nextErrors.cardholder = t.invalidCardholder;
    if (!payment.cardNumber.trim()) nextErrors.cardNumber = t.requiredPayment;
    else if (!isValidCardNumber(payment.cardNumber)) nextErrors.cardNumber = t.invalidCardNumber;
    if (!payment.expiry.trim()) nextErrors.expiry = t.requiredPayment;
    else if (!isValidCardExpiry(payment.expiry)) nextErrors.expiry = t.invalidExpiry;
    if (!payment.cvv.trim()) nextErrors.cvv = t.requiredPayment;
    else if (!isValidCvv(payment.cvv)) nextErrors.cvv = t.invalidCvv;

    if (Object.keys(nextErrors).length > 0) {
      setPaymentErrors(nextErrors);
      setError(Object.values(nextErrors)[0] ?? t.requiredPayment);
      return false;
    }

    setPaymentErrors({});
    return true;
  };

  const handlePlaceOrder = async () => {
    if (isPlacingOrder) return;
    setError(null);
    if (!validateCartStep() || !validateShippingStep() || !validatePaymentStep()) return;
    setIsPlacingOrder(true);

    const fullName = `${normalizeRussianName(shipping.firstName)} ${normalizeRussianName(shipping.lastName)}`;
    const address = `${normalizeRussianAddress(shipping.address)}, ${normalizeRussianLocation(shipping.city)}, ${normalizeRussianLocation(shipping.state)}, ${normalizeRussianPostalCode(shipping.zip)}`;
    const order = await placeOrder(fullName.trim(), normalizeEmail(shipping.email), address);
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
                      { key: "firstName", label: t.firstName, placeholder: "Иван", col: 1 },
                      { key: "lastName", label: t.lastName, placeholder: "Иванов", col: 1 },
                      { key: "email", label: t.email, placeholder: "ivan@mail.com", col: 2 },
                      { key: "phone", label: t.phone, placeholder: "+7 999 999 99 99", col: 2 },
                    ].map((f) => (
                      <div key={f.key} className={f.col === 2 ? "sm:col-span-2" : ""}>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {f.label}
                        </label>
                        <input
                          type={f.key === "email" ? "email" : "text"}
                          placeholder={f.placeholder}
                          value={shipping[f.key as keyof typeof shipping]}
                          onChange={(e) => {
                            let nextValue = e.target.value;

                            if (f.key === "firstName" || f.key === "lastName") {
                              nextValue = sanitizeRussianNameInput(nextValue);
                            } else if (f.key === "phone") {
                              nextValue = formatRussianPhone(nextValue);
                            }

                            setShipping((s) => ({ ...s, [f.key]: nextValue }));
                            if (shippingErrors[f.key as keyof typeof shipping]) {
                              setShippingErrors((current) => ({ ...current, [f.key]: undefined }));
                            }
                          }}
                          inputMode={f.key === "phone" ? "tel" : undefined}
                          autoComplete={f.key === "phone" ? "tel" : undefined}
                          maxLength={f.key === "phone" ? 16 : undefined}
                          className={cn(
                            "w-full border rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                            shippingErrors[f.key as keyof typeof shipping] ? "border-destructive" : "border-input"
                          )}
                        />
                        {shippingErrors[f.key as keyof typeof shipping] && (
                          <p className="mt-1 text-xs text-destructive">{shippingErrors[f.key as keyof typeof shipping]}</p>
                        )}
                      </div>
                    ))}

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {t.address}
                        </label>
                      <input
                        type="text"
                        placeholder={locale === "ru" ? "ул. Тверская, д. 12, кв. 8" : "ул. Тверская, д. 12, кв. 8"}
                        value={shipping.address}
                        onChange={(e) => {
                          setShipping((s) => ({ ...s, address: sanitizeRussianAddressInput(e.target.value) }));
                          if (shippingErrors.address) setShippingErrors((current) => ({ ...current, address: undefined }));
                        }}
                        className={cn(
                          "w-full border rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                          shippingErrors.address ? "border-destructive" : "border-input"
                        )}
                      />
                      {shippingErrors.address && <p className="mt-1 text-xs text-destructive">{shippingErrors.address}</p>}
                    </div>

                      {[
                      { key: "city", label: t.city, placeholder: "Москва" },
                      { key: "state", label: t.state, placeholder: "Московская область" },
                      { key: "zip", label: t.zip, placeholder: "101000" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                          {f.label}
                        </label>
                        <input
                          type="text"
                          placeholder={f.placeholder}
                          value={shipping[f.key as keyof typeof shipping]}
                          onChange={(e) => {
                            const nextValue =
                              f.key === "zip"
                                ? normalizeRussianPostalCode(e.target.value)
                                : sanitizeRussianLocationInput(e.target.value);
                            setShipping((s) => ({ ...s, [f.key]: nextValue }));
                            if (shippingErrors[f.key as keyof typeof shipping]) {
                              setShippingErrors((current) => ({ ...current, [f.key]: undefined }));
                            }
                          }}
                          inputMode={f.key === "zip" ? "numeric" : undefined}
                          maxLength={f.key === "zip" ? 6 : undefined}
                          className={cn(
                            "w-full border rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                            shippingErrors[f.key as keyof typeof shipping] ? "border-destructive" : "border-input"
                          )}
                        />
                        {shippingErrors[f.key as keyof typeof shipping] && (
                          <p className="mt-1 text-xs text-destructive">{shippingErrors[f.key as keyof typeof shipping]}</p>
                        )}
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
                        placeholder={locale === "ru" ? "IVANOV IVAN" : "IVANOV IVAN"}
                        value={payment.cardholder}
                        onChange={(e) => {
                          setPayment((current) => ({ ...current, cardholder: sanitizeCardholderNameInput(e.target.value) }));
                          if (paymentErrors.cardholder) setPaymentErrors((current) => ({ ...current, cardholder: undefined }));
                        }}
                        className={cn(
                          "w-full border rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                          paymentErrors.cardholder ? "border-destructive" : "border-input"
                        )}
                      />
                      {paymentErrors.cardholder && <p className="mt-1 text-xs text-destructive">{paymentErrors.cardholder}</p>}
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
                          {
                            setPayment((current) => ({
                              ...current,
                              cardNumber: formatCardNumber(e.target.value),
                            }));
                            if (paymentErrors.cardNumber) setPaymentErrors((current) => ({ ...current, cardNumber: undefined }));
                          }
                        }
                        inputMode="numeric"
                        className={cn(
                          "w-full border rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                          paymentErrors.cardNumber ? "border-destructive" : "border-input"
                        )}
                      />
                      {paymentErrors.cardNumber && <p className="mt-1 text-xs text-destructive">{paymentErrors.cardNumber}</p>}
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
                        onChange={(e) => {
                          setPayment((current) => ({ ...current, expiry: formatCardExpiry(e.target.value) }));
                          if (paymentErrors.expiry) setPaymentErrors((current) => ({ ...current, expiry: undefined }));
                        }}
                        inputMode="numeric"
                        className={cn(
                          "w-full border rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                          paymentErrors.expiry ? "border-destructive" : "border-input"
                        )}
                      />
                      {paymentErrors.expiry && <p className="mt-1 text-xs text-destructive">{paymentErrors.expiry}</p>}
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
                          {
                            setPayment((current) => ({
                              ...current,
                              cvv: normalizeCvv(e.target.value),
                            }));
                            if (paymentErrors.cvv) setPaymentErrors((current) => ({ ...current, cvv: undefined }));
                          }
                        }
                        inputMode="numeric"
                        className={cn(
                          "w-full border rounded px-3.5 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring",
                          paymentErrors.cvv ? "border-destructive" : "border-input"
                        )}
                      />
                      {paymentErrors.cvv && <p className="mt-1 text-xs text-destructive">{paymentErrors.cvv}</p>}
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
