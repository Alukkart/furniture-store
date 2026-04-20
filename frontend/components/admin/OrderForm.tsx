"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/currency";
import { usePreferences } from "@/lib/preferences";
import { adminText, translateOrderStatus } from "@/lib/admin-i18n";
import { cn } from "@/lib/utils";
import {
  isValidEmail,
  isValidRussianAddress,
  isValidRussianFullName,
  normalizeEmail,
  normalizeRussianAddress,
  normalizeRussianName,
  sanitizeRussianAddressInput,
  sanitizeRussianNameInput,
} from "@/lib/validation";
import type { Order, Product } from "@/lib/types";

const STATUS_OPTIONS: Order["status"][] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

type Props = {
  initialOrder: Order;
  products: Product[];
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (order: Order) => Promise<void>;
};

export default function OrderForm({ initialOrder, products, submitLabel, isSubmitting, onSubmit }: Props) {
  const locale = usePreferences((s) => s.locale);
  const t = adminText[locale].orderForm;
  const [order, setOrder] = useState<Order>(initialOrder);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    customer?: string;
    email?: string;
    address?: string;
  }>({});

  function updateItem(index: number, updates: Partial<Order["items"][number]>) {
    setOrder((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item
      ),
    }));
  }

  function changeItemProduct(index: number, productId: string) {
    const product = products.find((entry) => entry.id === productId);
    if (!product) return;
    updateItem(index, { product });
  }

  function addItem() {
    if (products.length === 0) return;
    setOrder((current) => ({
      ...current,
      items: [...current.items, { product: products[0], quantity: 1 }],
    }));
  }

  function removeItem(index: number) {
    setOrder((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const normalizedCustomer = normalizeRussianName(order.customer);
    const normalizedEmail = normalizeEmail(order.email);
    const normalizedAddress = normalizeRussianAddress(order.address);
    const nextErrors: typeof fieldErrors = {};

    if (!normalizedCustomer || !isValidRussianFullName(normalizedCustomer)) nextErrors.customer = t.required;
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) nextErrors.email = t.required;
    if (!normalizedAddress || !isValidRussianAddress(normalizedAddress)) nextErrors.address = t.required;
    if (order.items.length === 0) {
      setError(t.needItem);
      return;
    }
    if (order.items.some((item) => item.quantity <= 0)) {
      setError(t.quantityInvalid);
      return;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError(Object.values(nextErrors)[0] ?? t.required);
      return;
    }

    setFieldErrors({});
    await onSubmit({
      ...order,
      customer: normalizedCustomer,
      email: normalizedEmail,
      address: normalizedAddress,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">{t.orderDetails}</h2>
          <div className="mt-4 space-y-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.orderId}</span>
              <input value={order.id} disabled className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.customer}</span>
              <input
                value={order.customer}
                onChange={(e) => {
                  setOrder((current) => ({ ...current, customer: sanitizeRussianNameInput(e.target.value) }));
                  if (fieldErrors.customer) setFieldErrors((current) => ({ ...current, customer: undefined }));
                }}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground", fieldErrors.customer ? "border-destructive" : "border-input")}
              />
              {fieldErrors.customer && <span className="text-xs text-destructive">{fieldErrors.customer}</span>}
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.email}</span>
              <input
                type="email"
                value={order.email}
                onChange={(e) => {
                  setOrder((current) => ({ ...current, email: e.target.value }));
                  if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground", fieldErrors.email ? "border-destructive" : "border-input")}
              />
              {fieldErrors.email && <span className="text-xs text-destructive">{fieldErrors.email}</span>}
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.address}</span>
              <textarea
                value={order.address}
                onChange={(e) => {
                  setOrder((current) => ({ ...current, address: sanitizeRussianAddressInput(e.target.value) }));
                  if (fieldErrors.address) setFieldErrors((current) => ({ ...current, address: undefined }));
                }}
                rows={4}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground", fieldErrors.address ? "border-destructive" : "border-input")}
              />
              {fieldErrors.address && <span className="text-xs text-destructive">{fieldErrors.address}</span>}
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.date}</span>
              <input
                type="datetime-local"
                value={order.date.slice(0, 16)}
                onChange={(e) =>
                  setOrder((current) => ({
                    ...current,
                    date: new Date(e.target.value).toISOString(),
                  }))
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.status}</span>
              <select
                value={order.status}
                onChange={(e) => setOrder((current) => ({ ...current, status: e.target.value as Order["status"] }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {translateOrderStatus(locale, status)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">{t.items}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.itemsHelp}</p>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              {t.addItem}
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {order.items.map((item, index) => (
              <div key={`${item.product.id}-${index}`} className="rounded-lg border border-border p-4">
                <div className="grid gap-4 md:grid-cols-[1fr_120px_auto]">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-foreground">{t.product}</span>
                    <select
                      value={item.product.id}
                      onChange={(e) => changeItemProduct(index, e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-foreground">{t.qty}</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
                    >
                      {t.remove}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.lineTotal}: {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {t.orderTotal}
              <span className="ml-2 font-semibold text-foreground">
                {formatPrice(
                  order.items.reduce((total, item) => total + item.product.price * item.quantity, 0)
                )}
              </span>
            </p>
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? t.saving : submitLabel}
        </button>
      </div>
    </form>
  );
}
