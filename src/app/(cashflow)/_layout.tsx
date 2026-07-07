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

const nestedFormSheetOptions = {
  ...formSheetOptions,
  headerShown: false,
  sheetAllowedDetents: [0.72, 0.92],
};

const cashflowFormScreens = [
  "entry-form",
  "transfer",
  "categories",
  "automatic-entry",
  "quick-fill",
  "reminder",
  "statie",
];

export default function CashflowLayout() {
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
        <Stack.Screen name="forms/wallet" options={nestedFormSheetOptions} />
        {cashflowFormScreens.map((screen) => (
          <Stack.Screen key={screen} name={`forms/${screen}`} options={formSheetOptions} />
        ))}
      </Stack>
    </>
  );
}
