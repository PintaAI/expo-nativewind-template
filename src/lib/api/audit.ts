import { apiGet, apiPost } from "./client";

export type AuditSnapshot = {
  id: string;
  date: string;
  expectedBalance: number;
  actualBalance: number;
  difference: number;
  adjusted: boolean;
  note: string | null;
  createdAt: string;
};

function managementQuery(managementId?: string) {
  return managementId ? `?management_id=${encodeURIComponent(managementId)}` : "";
}

export async function getAuditBalance(managementId?: string) {
  const result = await apiGet<{ balance: number }>(`/audit/balance${managementQuery(managementId)}`);
  return result.balance;
}

export function getLatestAudit(managementId?: string) {
  return apiGet<AuditSnapshot | null>(`/audit/latest${managementQuery(managementId)}`);
}

export function performAudit(input: {
  managementId?: string;
  actualBalance: number;
  note?: string;
  autoAdjust: boolean;
}) {
  return apiPost<AuditSnapshot>("/audit", input);
}
