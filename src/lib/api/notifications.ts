import { apiDelete, apiPut } from "./client";

type PushPlatform = "ios" | "android";

export function saveExpoPushToken(token: string, platform: PushPlatform): Promise<void> {
  return apiPut("/notifications/push-token", { token, platform });
}

export function removeExpoPushToken(token: string): Promise<void> {
  return apiDelete("/notifications/push-token", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}
