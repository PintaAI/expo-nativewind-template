import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function SummaryLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: Platform.OS === "ios",
      }}
    />
  );
}
