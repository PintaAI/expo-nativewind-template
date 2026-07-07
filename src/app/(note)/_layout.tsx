import { Stack } from "expo-router";

const formSheetOptions = {
  presentation: "formSheet" as const,
  headerLargeTitle: false,
  headerTransparent: true,
  headerBlurEffect: "systemMaterial" as const,
  headerStyle: { backgroundColor: "transparent" },
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  sheetAllowedDetents: "fitToContents" as const,
  sheetExpandsWhenScrolledToEdge: false,
  sheetGrabberVisible: true,
};

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
          headerBlurEffect: "systemMaterial",
          headerStyle: { backgroundColor: "transparent" },
          headerShadowVisible: false,
          headerLargeTitleShadowVisible: false,
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
