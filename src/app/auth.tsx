import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { router, Stack } from "expo-router";
import { AppText } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { authClient } from "@/lib/auth-client";

type AuthProvider = "google" | "apple";

const providers: { id: AuthProvider; label: string; mark: string }[] = [
  { id: "google", label: "Continue with Google", mark: "G" },
  { id: "apple", label: "Continue with Apple", mark: "A" },
];

export default function Auth() {
  const appTheme = useAppTheme();
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
  const surface = appTheme.isDark ? "rgba(255,255,255,0.055)" : "rgba(15,23,42,0.035)";

  async function handleSocialSignIn(provider: AuthProvider) {
    setLoadingProvider(provider);
    setError(null);

    try {
      console.log("[auth] Starting social sign-in", { provider });

      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
      const { error: authError } = result;

      console.log("[auth] Social sign-in result", result);

      if (authError) {
        console.error("[auth] Social sign-in error", authError);
        setError(authError.message || authError.statusText || "Unable to sign in. Please try again.");
        return;
      }

      router.replace("/");
    } catch (caughtError) {
      console.error("[auth] Social sign-in threw", caughtError);
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          contentStyle: { backgroundColor: appTheme.colors.background },
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="xmark" onPress={() => router.back()} />
      </Stack.Toolbar>

      <ScrollView
        className="flex-1 bg-[--app-color-background]"
        contentContainerClassName="gap-5 px-5 pb-10 mt-5 pt-5"
      
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: appTheme.colors.background }}
      >
        <View className="gap-2">
          <AppText className="text-xs font-semibold uppercase tracking-[2px]" style={{ color: appTheme.colors.muted }}>
            Account
          </AppText>
          <AppText className="text-3xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
            Sign in
          </AppText>
          <AppText className="text-sm leading-5" style={{ color: appTheme.colors.muted }}>
            Continue with Google or Apple to sync your account.
          </AppText>
        </View>

        <View className="gap-3 rounded-3xl border p-4" style={{ borderColor, backgroundColor: surface }}>


          {providers.map((provider) => {
            const isLoading = loadingProvider === provider.id;
            const isDisabled = loadingProvider !== null;

            return (
              <Pressable
                key={provider.id}
                accessibilityRole="button"
                disabled={isDisabled}
                onPress={() => handleSocialSignIn(provider.id)}
                className="min-h-12 flex-row items-center justify-center gap-3 rounded-2xl border px-4"
                style={{
                  backgroundColor: appTheme.colors.background,
                  borderColor,
                  opacity: isDisabled && !isLoading ? 0.56 : 1,
                }}
              >
                {isLoading ? <ActivityIndicator color={appTheme.colors.foreground} /> : <AppText style={{ color: appTheme.colors.foreground, fontWeight: "700" }}>{provider.mark}</AppText>}
                <AppText style={{ color: appTheme.colors.foreground, fontWeight: "600" }}>{provider.label}</AppText>
              </Pressable>
            );
          })}

          {error ? <AppText className="text-sm" style={{ color: appTheme.colors.negative }}>{error}</AppText> : null}
        </View>
      </ScrollView>
    </>
  );
}
