import { Stack } from "expo-router";
import { Platform } from "react-native";

const detailOptions = Platform.select({
  ios: {
    presentation: "formSheet" as const,
    headerLargeTitle: false,
    headerTransparent: true,
    sheetAllowedDetents: "fitToContents" as const,
    sheetExpandsWhenScrolledToEdge: false,
    sheetGrabberVisible: true,
  },
  default: {
    presentation: "formSheet" as const,
    headerLargeTitle: false,
    headerTransparent: false,
    sheetAllowedDetents: [0.55, 0.9] as [number, number],
    sheetInitialDetentIndex: 0,
    sheetCornerRadius: 28,
    sheetElevation: 24,
    sheetShouldOverflowTopInset: false,
    sheetLargestUndimmedDetentIndex: "none" as const,
  },
});

const fontSettingsOptions = Platform.OS === "ios"
  ? detailOptions
  : {
      presentation: "formSheet" as const,
      headerLargeTitle: false,
      headerTransparent: false,
      sheetAllowedDetents: "fitToContents" as const,
      sheetInitialDetentIndex: 0,
      sheetCornerRadius: 28,
      sheetElevation: 24,
      sheetShouldOverflowTopInset: false,
      sheetLargestUndimmedDetentIndex: "none" as const,
      sheetResizeAnimationEnabled: true,
    };

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: Platform.OS === "ios",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="account" options={detailOptions} />
      <Stack.Screen name="font-settings" options={fontSettingsOptions} />
    </Stack>
  );
}
