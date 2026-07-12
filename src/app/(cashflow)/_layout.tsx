import { Stack } from "expo-router";

const formSheetOptions = {
  presentation: "formSheet" as const,
  headerLargeTitle: false,
  headerTransparent: true,
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
  "automatic-entry",
  "quick-fill",
  "reminder",
  "statie",
  "audit",
];

export default function CashflowLayout() {
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
        <Stack.Screen name="forms/wallet" options={formSheetOptions} />
        <Stack.Screen name="forms/wallet/detail" options={formSheetOptions} />
        <Stack.Screen name="forms/categories" options={nestedFormSheetOptions} />
        <Stack.Screen name="forms/category-entries" options={{ ...formSheetOptions, sheetAllowedDetents: [0.72, 0.92] }} />
        {cashflowFormScreens.map((screen) => (
          <Stack.Screen key={screen} name={`forms/${screen}`} options={formSheetOptions} />
        ))}
      </Stack>
    </>
  );
}
