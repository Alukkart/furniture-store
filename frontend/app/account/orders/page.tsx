"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, PackageCheck, Settings2, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";
import { siteText, translateCategory } from "@/lib/i18n";
import type { Order } from "@/lib/types";
import { listMyOrders } from "@/services/orders";
import { getApiErrorMessage } from "@/services/http";

function statusLabel(status: Order["status"], locale: "en" | "ru") {
  if (locale === "ru") {
    const labels: Record<Order["status"], string> = {
      pending: "В обработке",
      completed: "Завершен",
      cancelled: "Отменен",
    };
    return labels[status];
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AccountOrdersPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const locale = usePreferences((s) => s.locale);
  const t = siteText[locale].accountOrders;
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (currentUser.role !== "Client") {
      router.replace("/admin");
      return;
    }

    let cancelled = false;

    async function loadOrders() {
      setIsLoading(true);
      try {
        const data = await listMyOrders();
        if (!cancelled) {
          setOrders(data);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, t.loadFailed));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [currentUser, router, t.loadFailed]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold text-foreground">{t.title}</h1>
            <p className="mt-2 text-muted-foreground">
              {t.subtitle}
            </p>
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            {t.interfaceSettings}
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-border bg-card px-6 py-10 text-sm text-muted-foreground">
              {t.loading}
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">{t.emptyTitle}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.emptyText}
              </p>
              <Link
                href="/shop"
                className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {t.browse}
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-semibold text-foreground">{order.id}</h2>
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                        {statusLabel(order.status, locale)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4" />
                        {new Date(order.date).toLocaleString(locale === "ru" ? "ru-RU" : "en-US")}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <PackageCheck className="h-4 w-4" />
                        {order.items.length} {order.items.length === 1 ? t.item : t.items}
                      </span>
                    </div>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.deliveryAddress}</p>
                    <p className="mt-1 text-sm text-foreground">{order.address}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.product.id}`} className="rounded-xl border border-border px-4 py-3 compact-aware">
                      <p className="font-medium text-foreground">{item.product.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.quantity} × ${item.product.price.toLocaleString()} · {translateCategory(locale, item.product.category)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">{t.orderEmail}: {order.email}</p>
                  <p className="text-lg font-semibold text-foreground">${order.total.toLocaleString()}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
