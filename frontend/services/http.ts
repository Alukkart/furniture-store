import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem("maison-auth");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { state?: { token?: string } };
        const token = parsed?.state?.token;
        if (token) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // no-op
      }
    }
  }
  return config;
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

export function isDuplicateEmailError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;

  const payload = error.response?.data;
  const responseMessage =
    typeof payload === "string"
      ? payload
      : typeof payload === "object" && payload !== null
      ? typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : ""
      : "";

  const normalized = `${responseMessage} ${error.message}`.toLowerCase();

  return (
    normalized.includes("idx_users_email") ||
    normalized.includes("duplicate key value") ||
    normalized.includes("sqlstate 23505") ||
    normalized.includes("duplicate") && normalized.includes("email")
  );
}
