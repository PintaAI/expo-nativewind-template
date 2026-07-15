import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: Platform.OS === "ios",
      }}
    />
  );
}
