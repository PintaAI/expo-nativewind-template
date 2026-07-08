import type { ImageSource } from "expo-image";
import { authBaseURL, authClient } from "@/lib/auth-client";

function sourceFor(path: string, route: "management-photo" | "profile-photo"): ImageSource {
  const cookie = authClient.getCookie();
  const uri = `${authBaseURL}/api/${route}?pathname=${encodeURIComponent(path)}`;

  return {
    uri,
    ...(cookie ? { headers: { Cookie: cookie } } : {}),
  };
}

export function getManagementImageSource(image: string | null): ImageSource | null {
  if (!image || image.startsWith("symbol:")) return null;
  if (image.startsWith("managements/")) return sourceFor(image, "management-photo");
  return { uri: image };
}

export function getProfileImageSource(image: string | null): ImageSource | null {
  if (!image) return null;
  if (image.startsWith("profiles/")) return sourceFor(image, "profile-photo");
  return { uri: image };
}
