import type { ForecastResponse } from "@/lib/types";
import { api } from "./http";

export async function getForecast(period = 3) {
  const { data } = await api.get<ForecastResponse>(`/forecast?period=${period}`);
  return data;
}

export async function trainForecast() {
  const { data } = await api.post<{ trained_at: string; mae: number; rmse: number; models: number }>("/forecast/train");
  return data;
}
