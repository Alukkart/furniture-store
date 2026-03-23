"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getForecast, trainForecast } from "@/services/forecast";
import type { ForecastResponse } from "@/lib/types";
import { useAuth } from "@/lib/auth";

export default function ForecastPage() {
  const [period, setPeriod] = useState(3);
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasAnyRole } = useAuth();

  async function loadForecast(targetPeriod = period) {
    setLoading(true);
    setError(null);
    try {
      const response = await getForecast(targetPeriod);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load forecast");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canTrain = hasAnyRole(["Administrator", "Executive"]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Demand Forecast</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Prediction by category with procurement recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="border border-input rounded px-3 py-2 text-sm bg-card"
            >
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
            </select>
            <button
              onClick={() => loadForecast(period)}
              className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm"
            >
              Refresh
            </button>
            <button
              disabled={!canTrain}
              onClick={async () => {
                setLoading(true);
                try {
                  await trainForecast();
                  await loadForecast(period);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to train model");
                } finally {
                  setLoading(false);
                }
              }}
              className="px-3 py-2 rounded border border-input text-sm disabled:opacity-50"
            >
              Retrain
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded border border-destructive/30 bg-destructive/5 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading && <p className="text-sm text-muted-foreground">Loading forecast...</p>}

        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded border border-border bg-card">
                <p className="text-xs text-muted-foreground">Model trained at</p>
                <p className="font-medium">{new Date(data.trained_at).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded border border-border bg-card">
                <p className="text-xs text-muted-foreground">MAE</p>
                <p className="font-medium">{data.mae.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded border border-border bg-card">
                <p className="text-xs text-muted-foreground">RMSE</p>
                <p className="font-medium">{data.rmse.toFixed(2)}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-left px-4 py-3">Forecast Qty</th>
                    <th className="text-left px-4 py-3">Recommended Buy</th>
                    <th className="text-left px-4 py-3">Confidence</th>
                    <th className="text-left px-4 py-3">Factors</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.category_id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">{row.category}</td>
                      <td className="px-4 py-3">{row.forecast_qty}</td>
                      <td className="px-4 py-3">{row.recommended_buy}</td>
                      <td className="px-4 py-3">{(row.confidence * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.factors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
