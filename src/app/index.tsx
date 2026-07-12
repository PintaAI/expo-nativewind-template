import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, type Href } from "expo-router";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useAuth } from "@/components/AuthProvider";
import { getPreference } from "@/lib/preferences";

export default function Home() {
  const appTheme = useAppTheme();
  const auth = useAuth();
  const [loadingPref, setLoadingPref] = useState(true);
  const [hasSkippedOnboarding, setHasSkippedOnboarding] = useState(false);

  useEffect(() => {
    getPreference("hasSkippedOnboarding").then((value) => {
      setHasSkippedOnboarding(Boolean(value));
      setLoadingPref(false);
    });
  }, []);

  useEffect(() => {
    if (auth.isPending || loadingPref) return;

    if (!hasSkippedOnboarding) {
      router.replace("/onboarding" as Href);
    } else {
      router.replace((auth.isAuthenticated ? "/home" : "/onboarding") as Href);
    }
  }, [auth.isAuthenticated, auth.isPending, hasSkippedOnboarding, loadingPref]);

  return (
    <View className="flex-1 items-center justify-center gap-4 px-5" style={{ backgroundColor: appTheme.colors.background }}>
      <ActivityIndicator color={appTheme.colors.primary} />
      <Text className="text-sm font-semibold" style={appTheme.text.muted}>
        Loading Ethos...
      </Text>
    </View>
  );
}
