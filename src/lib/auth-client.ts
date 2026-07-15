import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

export const authBaseURL = process.env.EXPO_PUBLIC_BETTER_AUTH_URL ?? "https://cashflow-notion.vercel.app";

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  plugins: [
    expoClient({
      scheme: "ethos",
      storagePrefix: "ethos",
      storage: SecureStore,
    }),
  ],
});
