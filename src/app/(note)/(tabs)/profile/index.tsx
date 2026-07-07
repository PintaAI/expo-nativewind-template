import { ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "@/components/AppTheme";

export default function ProfileScreen() {
  const appTheme = useAppTheme();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("tabs.profile") }} />
      <ScrollView
        className="flex-1 bg-[--app-color-background]"
        contentContainerClassName="items-center justify-center px-5 pb-10 pt-20"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text className="text-3xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
          {t("notes.profile")}
        </Text>
        <Text className="mt-2 text-center text-base" style={{ color: appTheme.colors.muted }}>
          {t("notes.placeholder")}
        </Text>
      </ScrollView>
    </>
  );
}
