"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Loader2, Package2, ShoppingCart, TrendingUp } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { formatPrice } from "@/lib/currency";
import { usePreferences } from "@/lib/preferences";
import { adminText } from "@/lib/admin-i18n";
import { useStore } from "@/lib/store";
import { getForecast, trainForecast } from "@/services/forecast";
import { getApiErrorMessage } from "@/services/http";
import type { ForecastResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const PERIOD_OPTIONS = [1, 3, 6];

function confidenceClass(confidence: number) {
  if (confidence >= 0.75) return "bg-emerald-50 text-emerald-700";
  if (confidence >= 0.5) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

export default function ForecastPage() {
  const { currentUser } = useAuth();
  const orders = useStore((s) => s.orders);
  const locale = usePreferences((s) => s.locale);
  const t = adminText[locale].forecast;
  const [periodMonths, setPeriodMonths] = useState(3);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadForecast() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getForecast(periodMonths);
        if (!cancelled) setForecast(data);
      } catch (loadError) {
        if (!cancelled) setError(getApiErrorMessage(loadError, t.failedLoad));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadForecast();
    return () => {
      cancelled = true;
    };
  }, [periodMonths, t.failedLoad]);

  const maxForecastQty = useMemo(() => {
    if (!forecast?.rows.length) return 1;
    return Math.max(...forecast.rows.map((item) => item.forecast_qty), 1);
  }, [forecast]);

  const totalRecommendedBuy = useMemo(() => {
    return forecast?.rows.reduce((sum, item) => sum + item.recommended_buy, 0) ?? 0;
  }, [forecast]);

  const categorySales = useMemo(() => {
    const salesMap = new Map<string, { units: number; revenue: number }>();

    orders
      .filter((order) => order.status !== "cancelled")
      .forEach((order) => {
        order.items.forEach((item) => {
          const key = item.product.category;
          const current = salesMap.get(key) ?? { units: 0, revenue: 0 };
          current.units += item.quantity;
          current.revenue += item.product.price * item.quantity;
          salesMap.set(key, current);
        });
      });

    return Array.from(salesMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((left, right) => right.units - left.units);
  }, [orders]);

  async function handleRetrain() {
    setIsTraining(true);
    setError(null);
    try {
      await trainForecast();
      const data = await getForecast(periodMonths);
      setForecast(data);
    } catch (trainError) {
      setError(getApiErrorMessage(trainError, t.failedTrain));
    } finally {
      setIsTraining(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">{t.title}</h1>
            <p className="mt-1 text-muted-foreground">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setPeriodMonths(option)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  option === periodMonths
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                {option} {option > 1 ? t.months : t.month}
              </button>
            ))}
            {(currentUser?.role === "Administrator" || currentUser?.role === "Executive") && (
              <button
                type="button"
                onClick={handleRetrain}
                disabled={isTraining}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isTraining ? t.retraining : t.retrain}
              </button>
            )}
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "MAE", value: forecast?.mae.toFixed(2) ?? "—", hint: t.maeHint, icon: TrendingUp },
            { label: "RMSE", value: forecast?.rmse.toFixed(2) ?? "—", hint: t.rmseHint, icon: CalendarRange },
            { label: t.suggestedBuy, value: forecast ? `${totalRecommendedBuy}` : "—", hint: t.suggestedHint, icon: ShoppingCart },
            { label: t.trained, value: forecast ? new Date(forecast.trained_at).toLocaleString(locale === "ru" ? "ru-RU" : "en-US") : "—", hint: `${periodMonths}-${periodMonths > 1 ? t.months : t.month} ${t.planningHorizon}`, icon: Package2 },
          ].map(({ label, value, hint, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.building}
            </div>
          </div>
        ) : forecast ? (
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-6 py-4">
                <h2 className="font-semibold text-foreground">{t.categoryOutlook}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t.categoryOutlookHint}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.category}</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.forecast}</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">{t.restock}</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">{t.modelNote}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {forecast.rows.map((item) => (
                      <tr key={item.category_id} className="align-top">
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">{item.category}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{t.categoryId} {item.category_id}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-foreground">{item.forecast_qty} {t.units}</p>
                          <div className="mt-3 h-2.5 w-40 rounded-full bg-muted">
                            <div className="h-2.5 rounded-full bg-accent transition-all" style={{ width: `${Math.max(8, (item.forecast_qty / maxForecastQty) * 100)}%` }} />
                          </div>
                        </td>
                        <td className="hidden px-5 py-4 md:table-cell">
                          <p className="text-sm font-semibold text-foreground">{item.recommended_buy} {t.units}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{t.safetyRecommendation}</p>
                        </td>
                        <td className="hidden px-5 py-4 lg:table-cell">
                          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", confidenceClass(item.confidence))}>
                            {Math.round(item.confidence * 100)}% {t.confidence}
                          </span>
                          <p className="mt-2 text-xs text-muted-foreground">{item.factors}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-foreground">{t.categorySales}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t.categorySalesHint}</p>
                <div className="mt-4 space-y-3">
                  {categorySales.length > 0 ? (
                    categorySales.map((item) => (
                      <div
                        key={item.category}
                        className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{item.category}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t.salesUnits.replace("{count}", String(item.units))}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatPrice(item.revenue)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.noCategorySales}</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-foreground">{t.howToRead}</h2>
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <p>{t.how1}</p>
                  <p>{t.how2}</p>
                  <p>{t.how3}</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-foreground">{t.notes}</h2>
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <p>{t.note1}</p>
                  <p>{t.note2}</p>
                  <p>{t.note3}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
