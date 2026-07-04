import { ScrollView, View } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { Stack } from "expo-router";
import { useDrawer } from "@/components/DrawerContext";
import { useAppTheme } from "@/components/AppTheme";

export default function SummaryScreen() {
  const { open } = useDrawer();
  const appTheme = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Summary" }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="sidebar.left" onPress={open} />
      </Stack.Toolbar>
      <ScrollView
        className="flex-1 bg-[--app-color-background]"
        contentContainerClassName="items-center justify-center px-5 pb-10 pt-20"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text className="text-3xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
          Notes Summary
        </Text>
        <Text className="mt-2 text-center text-base" style={{ color: appTheme.colors.muted }}>
          Placeholder
        </Text>
      </ScrollView>
    </>
  );
}
