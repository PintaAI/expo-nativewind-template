import { File, UploadType } from "expo-file-system";

import { authBaseURL, authClient } from "@/lib/auth-client";

export const apiBaseURL = `${authBaseURL}/api/v1`;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const cookie = authClient.getCookie();
  const isMultipart = typeof FormData !== "undefined" && init.body instanceof FormData;
  const res = await fetch(`${apiBaseURL}${path}`, {
    ...init,
    headers: {
      ...(isMultipart ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(init.headers ?? {}),
    },
    credentials: "omit",
  });
  const text = await res.text();
  let json: { data?: T; error?: string } = {};
  if (text) {
    try {
      json = JSON.parse(text) as { data?: T; error?: string };
    } catch {
      json = {};
    }
  }
  if (!res.ok) throw new ApiError(res.status, json.error ?? res.statusText);
  return json.data as T;
}

export function apiGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, { ...init, method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body?: unknown, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function apiPut<T>(path: string, body?: unknown, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    method: "PUT",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function apiUploadFile<T>(
  path: string,
  file: { uri: string; type: string },
  init: { fieldName: string; method?: "POST" | "PUT" | "PATCH"; parameters?: Record<string, string> },
): Promise<T> {
  const cookie = authClient.getCookie();
  const result = await new File(file.uri).upload(`${apiBaseURL}${path}`, {
    httpMethod: init.method ?? "POST",
    uploadType: UploadType.MULTIPART,
    fieldName: init.fieldName,
    mimeType: file.type,
    parameters: init.parameters,
    headers: cookie ? { Cookie: cookie } : undefined,
  });
  let json: { data?: T; error?: string } = {};
  if (result.body) {
    try {
      json = JSON.parse(result.body) as { data?: T; error?: string };
    } catch {
      json = {};
    }
  }
  if (result.status < 200 || result.status >= 300) throw new ApiError(result.status, json.error ?? "Upload failed");
  return json.data as T;
}

export function apiDelete(path: string, init: RequestInit = {}): Promise<void> {
  return apiFetch<void>(path, { ...init, method: "DELETE" });
}
