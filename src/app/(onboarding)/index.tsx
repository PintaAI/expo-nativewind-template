import { View } from "react-native";
import { Stack } from "expo-router";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";

export default function OnboardingScreen() {
  const appTheme = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Onboarding", headerLargeTitle: true }} />
      <View className="flex-1 items-center justify-center bg-[--app-color-background] px-5">
        <Text className="text-3xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
          Onboarding
        </Text>
        <Text className="mt-2 text-center text-base" style={{ color: appTheme.colors.muted }}>
          Welcome to Ethos
        </Text>
      </View>
    </>
  );
}
