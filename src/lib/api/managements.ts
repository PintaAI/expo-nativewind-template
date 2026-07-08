import { apiDelete, apiGet, apiPatch, apiPost, apiUploadFile } from "./client";
import type { ServerCurrentManagement, ServerManagement, ServerManagementImageUpdate, ServerManagementInvite } from "./types";
import type { PickedUploadImage } from "../imageUpload";

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

export function deleteManagement(id: string): Promise<void> {
  return apiDelete(`/managements/${encodeURIComponent(id)}`);
}

export function createManagementInvite(managementId: string): Promise<ServerManagementInvite> {
  return apiPost<ServerManagementInvite>(`/managements/${encodeURIComponent(managementId)}/invites`);
}

export function updateManagementImage(managementId: string, image: PickedUploadImage): Promise<ServerManagementImageUpdate> {
  return apiUploadFile<ServerManagementImageUpdate>(`/managements/${encodeURIComponent(managementId)}/image`, image, {
    method: "PUT",
    fieldName: "image",
  });
}

export function deleteManagementMember(managementId: string, memberId: string): Promise<void> {
  return apiDelete(`/managements/${encodeURIComponent(managementId)}/members/${encodeURIComponent(memberId)}`);
}
