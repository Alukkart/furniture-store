import type { AdminUser, RoleName } from "@/lib/types";
import { api } from "./http";

type LoginResponse = {
  user: AdminUser;
  token: string;
};

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  return data;
}

export async function register(email: string, password: string, name: string, role: RoleName) {
  const { data } = await api.post<AdminUser>("/auth/register", { email, password, name, role });
  return data;
}

export async function signupClient(email: string, password: string, name: string) {
  const { data } = await api.post<AdminUser>("/auth/signup", { email, password, name });
  return data;
}
