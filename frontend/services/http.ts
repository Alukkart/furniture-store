import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export function getApiErrorMessage(error: unknown, fallback = "Request failed") {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data;
    const responseMessage =
      typeof payload === "string"
        ? payload
        : typeof payload === "object" && payload !== null
        ? typeof (payload as { message?: unknown }).message === "string"
          ? (payload as { message: string }).message
          : typeof (payload as { error?: unknown }).error === "string"
          ? (payload as { error: string }).error
          : null
        : null;

    return responseMessage ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
