import { View } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";

export default function OnboardingScreen() {
  const appTheme = useAppTheme();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("onboarding.title"), headerLargeTitle: true }} />
      <View className="flex-1 items-center justify-center bg-[--app-color-background] px-5">
        <Text className="text-3xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
          {t("onboarding.title")}
        </Text>
        <Text className="mt-2 text-center text-base" style={{ color: appTheme.colors.muted }}>
          {t("onboarding.welcome")}
        </Text>
      </View>
    </>
  );
}
