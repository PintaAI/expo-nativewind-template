import { Stack } from "expo-router";
import { Platform } from "react-native";

const formSheetOptions = Platform.select({
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
    sheetAllowedDetents: "fitToContents" as const,
    sheetInitialDetentIndex: 0,
    sheetCornerRadius: 28,
    sheetElevation: 24,
    sheetShouldOverflowTopInset: false,
    sheetLargestUndimmedDetentIndex: "none" as const,
    sheetResizeAnimationEnabled: true,
  },
});

const noteFormScreens = [
  "notebooks",
  "tags",
  "archive",
];

export default function NoteLayout() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <Stack
        screenOptions={{
          headerLargeTitle: true,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {noteFormScreens.map((screen) => (
          <Stack.Screen key={screen} name={`forms/${screen}`} options={formSheetOptions} />
        ))}
      </Stack>
    </>
  );
}
