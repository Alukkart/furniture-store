import type { AuditLog } from "@/lib/types";
import { api } from "./http";

export async function listAuditLogs() {
  const { data } = await api.get<AuditLog[]>("/audit-logs");
  return data;
}
