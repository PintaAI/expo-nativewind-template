import { ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { Stack } from "expo-router";
import { useAppTheme } from "@/components/AppTheme";

export default function ProfileScreen() {
  const appTheme = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Profile" }} />
      <ScrollView
        className="flex-1 bg-[--app-color-background]"
        contentContainerClassName="items-center justify-center px-5 pb-10 pt-20"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text className="text-3xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
          Profile
        </Text>
        <Text className="mt-2 text-center text-base" style={{ color: appTheme.colors.muted }}>
          Placeholder
        </Text>
      </ScrollView>
    </>
  );
}
