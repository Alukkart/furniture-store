import type { AdminUser } from "@/lib/types";
import { api } from "./http";

type LoginResponse = {
  user: AdminUser;
  token: string;
};

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  return data;
}
