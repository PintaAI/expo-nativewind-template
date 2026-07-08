import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="account"
        options={{
          presentation: "formSheet",
          headerLargeTitle: false,
          headerTransparent: true,
          sheetAllowedDetents: "fitToContents",
          sheetExpandsWhenScrolledToEdge: false,
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="font-settings"
        options={{
          presentation: "formSheet",
          headerLargeTitle: false,
          headerTransparent: true,
          sheetAllowedDetents: "fitToContents",
          sheetExpandsWhenScrolledToEdge: false,
          sheetGrabberVisible: true,
        }}
      />
    </Stack>
  );
}
