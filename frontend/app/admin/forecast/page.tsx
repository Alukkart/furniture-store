"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarRange, Loader2, Package2, Truck } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { getForecast } from "@/services/forecast";
import { getApiErrorMessage } from "@/services/http";
import type { ForecastResponse, ShipmentForecast } from "@/lib/types";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS = [14, 30, 60];

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function riskBadgeClass(label: ShipmentForecast["delayRiskLabel"]) {
  switch (label) {
    case "High":
      return "bg-red-50 text-red-700";
    case "Medium":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-emerald-50 text-emerald-700";
  }
}

export default function ForecastPage() {
  const [planningDays, setPlanningDays] = useState(30);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadForecast() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getForecast(planningDays);
        if (!cancelled) {
          setForecast(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, "Failed to load delivery forecast"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadForecast();
    return () => {
      cancelled = true;
    };
  }, [planningDays]);

  const maxTransitDays = useMemo(() => {
    if (!forecast?.shipmentForecasts.length) return 1;
    return Math.max(...forecast.shipmentForecasts.map((item) => item.estimatedTransitDays), 1);
  }, [forecast]);

  const maxRegionRisk = useMemo(() => {
    if (!forecast?.regionForecasts.length) return 1;
    return Math.max(...forecast.regionForecasts.map((item) => item.averageDelayRisk), 1);
  }, [forecast]);

  const highRiskCount = forecast?.shipmentForecasts.filter((item) => item.delayRiskLabel === "High").length ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Delivery Forecast</h1>
            <p className="mt-1 text-muted-foreground">
              AI module estimates incoming delivery dates and flags logistics delay risk by product.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setPlanningDays(option)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  option === planningDays
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                {option} day plan
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "ETA MAE",
              value: forecast?.metrics.etaMae.toFixed(2) ?? "—",
              hint: "Average ETA error in days",
              icon: Truck,
            },
            {
              label: "Risk Accuracy",
              value: forecast ? `${forecast.metrics.riskAccuracy.toFixed(1)}%` : "—",
              hint: "Risk bucket agreement on validation set",
              icon: AlertTriangle,
            },
            {
              label: "High Risk",
              value: forecast ? `${highRiskCount}` : "—",
              hint: "Shipments currently marked high risk",
              icon: Package2,
            },
            {
              label: "Generated",
              value: forecast ? formatDate(forecast.generatedAt) : "—",
              hint: `${planningDays}-day planning horizon`,
              icon: CalendarRange,
            },
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
              Building delivery forecast...
            </div>
          </div>
        ) : forecast ? (
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-6 py-4">
                <h2 className="font-semibold text-foreground">Shipment ETA by Product</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Expected arrival date, transit time, and main logistics risk factor.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">ETA</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Route</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {forecast.shipmentForecasts.map((item) => (
                      <tr key={item.productId} className="align-top">
                        <td className="px-5 py-4">
                          <p className="font-medium text-foreground">{item.productName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.category} · stock {item.stock} · ${item.price.toLocaleString()}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-foreground">{formatDate(item.estimatedDeliveryDate)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.estimatedTransitDays} transit days · on-time {item.onTimeProbability.toFixed(0)}%
                          </p>
                          <div className="mt-3 h-2.5 w-40 rounded-full bg-muted">
                            <div
                              className="h-2.5 rounded-full bg-accent transition-all"
                              style={{
                                width: `${Math.max(8, (item.estimatedTransitDays / maxTransitDays) * 100)}%`,
                              }}
                            />
                          </div>
                        </td>
                        <td className="hidden px-5 py-4 md:table-cell">
                          <p className="text-sm text-foreground">{item.supplierRegion}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.shippingMode}</p>
                        </td>
                        <td className="hidden px-5 py-4 lg:table-cell">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", riskBadgeClass(item.delayRiskLabel))}>
                              {item.delayRiskLabel} risk
                            </span>
                            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground">
                              {item.delayRiskScore.toFixed(0)}%
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Primary factor: {item.primaryRiskFactor}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">{item.explanation}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-foreground">Regional Risk Outlook</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Average delay exposure by supplier region.
                </p>

                <div className="mt-5 space-y-4">
                  {forecast.regionForecasts.map((region) => (
                    <div key={region.supplierRegion}>
                      <div className="mb-1 flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-foreground">{region.supplierRegion}</p>
                        <p className="text-xs text-muted-foreground">
                          {region.averageDelayRisk.toFixed(0)}% risk
                        </p>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted">
                        <div
                          className="h-2.5 rounded-full bg-emerald-500"
                          style={{
                            width: `${Math.max(8, (region.averageDelayRisk / maxRegionRisk) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Avg transit {region.averageTransitDays.toFixed(1)} days · high risk {region.highRiskShipments}/{region.forecastedShipments}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-foreground">Model Notes</h2>
                <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <p>
                    Model type: gradient boosting over prepared logistics history with supplier region,
                    shipping mode, distance, customs complexity, congestion, stock pressure, and order load.
                  </p>
                  <p>
                    Supplier regions in training: {forecast.modelSummary.supplierRegions.join(", ")}.
                  </p>
                  <p>
                    Shipping modes tracked: {forecast.modelSummary.shippingModes.join(", ")}.
                  </p>
                  <p>
                    Use this panel for replenishment planning and escalation, not as a contractual carrier promise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}
