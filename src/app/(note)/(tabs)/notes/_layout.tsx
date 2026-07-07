import { Stack } from "expo-router";

export default function NotesLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBlurEffect: "systemMaterial",
        headerStyle: { backgroundColor: "transparent" },
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
      }}
    />
  );
}
