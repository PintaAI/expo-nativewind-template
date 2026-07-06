import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { ServerQuickFill } from "./types";

export function listQuickFills(managementId?: string): Promise<ServerQuickFill[]> {
  const qs = managementId ? `?management_id=${encodeURIComponent(managementId)}` : "";
  return apiGet<ServerQuickFill[]>(`/quick-fills${qs}`);
}

export function createQuickFill(body: {
  name: string;
  nominal: number;
  categoryId?: string;
  managementId?: string;
}): Promise<ServerQuickFill> {
  return apiPost<ServerQuickFill>("/quick-fills", body);
}

export function updateQuickFill(id: string, body: Partial<{ name: string; nominal: number; categoryId: string }>): Promise<ServerQuickFill> {
  return apiPatch<ServerQuickFill>(`/quick-fills/${encodeURIComponent(id)}`, body);
}

export function deleteQuickFill(id: string, managementId?: string): Promise<void> {
  const qs = managementId ? `?management_id=${encodeURIComponent(managementId)}` : "";
  return apiDelete(`/quick-fills/${encodeURIComponent(id)}${qs}`);
}