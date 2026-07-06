import { apiDelete } from "./client";

export function deleteAccount(): Promise<void> {
  return apiDelete("/account");
}
