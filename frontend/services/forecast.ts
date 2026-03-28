import type { ForecastResponse } from "@/lib/types";
import { api } from "./http";

export async function getForecast(days = 30) {
  const { data } = await api.get<ForecastResponse>("/forecast", {
    params: { days },
  });
  return data;
}
