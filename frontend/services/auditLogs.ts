import type { AuditCategory, AuditLog, AuditSeverity } from "@/lib/types";
import { api } from "./http";

type CreateAuditLogPayload = {
  action: string;
  category: AuditCategory;
  user: string;
  details: string;
  severity: AuditSeverity;
};

export async function listAuditLogs() {
  const { data } = await api.get<AuditLog[]>("/audit-logs");
  return data;
}

export async function createAuditLog(payload: CreateAuditLogPayload) {
  const { data } = await api.post<AuditLog>("/audit-logs", payload);
  return data;
}
