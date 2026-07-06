import { apiDelete, apiGet, apiPatch, apiPost, apiPutForm } from "./client";
import type { ServerCurrentManagement, ServerManagement, ServerManagementImageUpdate, ServerManagementInvite } from "./types";

export function listManagements(): Promise<ServerManagement[]> {
  return apiGet<ServerManagement[]>("/managements");
}

export function createManagement(body: { name: string }): Promise<ServerManagement> {
  return apiPost<ServerManagement>("/managements", body);
}

export function getActiveManagement(managementId?: string): Promise<ServerCurrentManagement | null> {
  const qs = managementId ? `?management_id=${encodeURIComponent(managementId)}` : "";
  return apiGet<ServerCurrentManagement | null>(`/managements/current${qs}`);
}

export function updateManagement(id: string, body: { name: string }): Promise<ServerManagement> {
  return apiPatch<ServerManagement>(`/managements/${encodeURIComponent(id)}`, body);
}

export function createManagementInvite(managementId: string): Promise<ServerManagementInvite> {
  return apiPost<ServerManagementInvite>(`/managements/${encodeURIComponent(managementId)}/invites`);
}

export function updateManagementImage(managementId: string, formData: FormData): Promise<ServerManagementImageUpdate> {
  return apiPutForm<ServerManagementImageUpdate>(`/managements/${encodeURIComponent(managementId)}/image`, formData);
}

export function deleteManagementMember(managementId: string, memberId: string): Promise<void> {
  return apiDelete(`/managements/${encodeURIComponent(managementId)}/members/${encodeURIComponent(memberId)}`);
}
