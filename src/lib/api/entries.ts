import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { CreateEntryBody, EntriesListResponse, ServerEntry, UpdateEntryBody } from "./types";

export type ListEntriesParams = {
  managementId?: string;
  page_size?: number;
  skip?: number;
  io?: "Income" | "Expenses";
  date?: string;
  created_by_id?: string;
};

export async function listEntries(params: ListEntriesParams = {}): Promise<ServerEntry[]> {
  const query: string[] = [];
  if (params.managementId) query.push(`management_id=${encodeURIComponent(params.managementId)}`);
  if (params.page_size !== undefined) query.push(`page_size=${params.page_size}`);
  if (params.skip !== undefined) query.push(`skip=${params.skip}`);
  if (params.io) query.push(`io=${params.io}`);
  if (params.date) query.push(`date=${encodeURIComponent(params.date)}`);
  if (params.created_by_id) query.push(`created_by_id=${encodeURIComponent(params.created_by_id)}`);

  const qs = query.length > 0 ? `?${query.join("&")}` : "";
  const payload = await apiGet<EntriesListResponse | ServerEntry[]>(`/entries${qs}`);

  if (Array.isArray(payload)) return payload;
  return payload.entries ?? [];
}

export function createEntry(body: CreateEntryBody): Promise<ServerEntry> {
  return apiPost<ServerEntry>("/entries", body);
}

export function updateEntry(id: string, body: UpdateEntryBody): Promise<ServerEntry> {
  return apiPatch<ServerEntry>(`/entries/${encodeURIComponent(id)}`, body);
}

export function deleteEntry(id: string, managementId?: string): Promise<void> {
  const qs = managementId ? `?management_id=${encodeURIComponent(managementId)}` : "";
  return apiDelete(`/entries/${encodeURIComponent(id)}${qs}`);
}