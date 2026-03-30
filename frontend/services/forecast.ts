import type { ForecastResponse } from "@/lib/types";
import { api } from "./http";

export async function getForecast(months = 3) {
  const { data } = await api.get<ForecastResponse>("/forecast", {
    params: { months },
  });
  return data;
}

export async function trainForecast() {
  const { data } = await api.post("/forecast/train");
  return data;
}
