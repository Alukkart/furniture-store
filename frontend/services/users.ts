import type { RoleName } from "@/lib/types";
import { api } from "./http";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  role: {
    id: number;
    name: RoleName;
  };
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
};

export async function listUsers() {
  const { data } = await api.get<UserRecord[]>("/users");
  return data;
}

export async function createUser(payload: { email: string; password: string; name: string; role: RoleName }) {
  const { data } = await api.post<UserRecord>("/users", payload);
  return data;
}

export async function setUserBlocked(id: string, isBlocked: boolean) {
  await api.patch(`/users/${id}/block`, { is_blocked: isBlocked });
}
