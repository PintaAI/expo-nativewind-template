import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { ServerCategory } from "./types";

export function listCategories(managementId?: string): Promise<ServerCategory[]> {
  const qs = managementId ? `?detailed=true&management_id=${encodeURIComponent(managementId)}` : "?detailed=true";
  return apiGet<ServerCategory[]>(`/categories${qs}`);
}

export function createCategory(body: {
  name: string;
  color?: string;
  icon?: string;
  budgets?: Record<string, number>;
  managementId?: string;
}): Promise<ServerCategory> {
  return apiPost<ServerCategory>("/categories", body);
}

export function updateCategory(
  id: string,
  body: Partial<{ name: string; color: string; icon: string; budgets: Record<string, number>; managementId: string }>,
): Promise<ServerCategory> {
  return apiPatch<ServerCategory>(`/categories/${encodeURIComponent(id)}`, body);
}

export function deleteCategory(id: string, managementId?: string): Promise<void> {
  const qs = managementId ? `?management_id=${encodeURIComponent(managementId)}` : "";
  return apiDelete(`/categories/${encodeURIComponent(id)}${qs}`);
}