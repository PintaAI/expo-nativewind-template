import "../global.css";
import "@/i18n";
import "@/tasks/automaticEntries";
import { Suspense } from "react";
import { ThemeProvider, DefaultTheme, DarkTheme, Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { AppThemeProvider, useAppTheme } from "@/components/AppTheme";
import { AuthProvider } from "@/components/AuthProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { DrawerProvider } from "@/components/DrawerContext";
import { SyncProvider } from "@/components/SyncProvider";
import { CashflowDataProvider } from "@/data/cashflow/CashflowDataProvider";
import { migrateCashflowDatabase } from "@/data/cashflow/schema";
import { configureForegroundNotifications } from "@/lib/notifications";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

configureForegroundNotifications();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <RootNavigator />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const appTheme = useAppTheme();
  const navigationTheme = appTheme.isDark ? DarkTheme : DefaultTheme;
  const themedNavigation = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      primary: appTheme.colors.primary,
      background: appTheme.colors.background,
      card: appTheme.colors.background,
      text: appTheme.colors.foreground,
      border: appTheme.colors.overlay,
      notification: appTheme.colors.secondary,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: appTheme.colors.background }}>
      <ThemeProvider value={themedNavigation}>
        <AuthProvider>
          <CurrencyProvider>
          <Suspense fallback={<View style={{ flex: 1, backgroundColor: appTheme.colors.background }} />}>
            <SQLiteProvider databaseName="ethos-cashflow.db" onInit={migrateCashflowDatabase} useSuspense>
              <CashflowDataProvider>
                <SyncProvider>
                  <DrawerProvider>
                  <Stack
                    screenOptions={{
                      contentStyle: { backgroundColor: appTheme.colors.background },
                      headerStyle: { backgroundColor: appTheme.colors.background },
                      headerTintColor: appTheme.colors.foreground,
                      headerShadowVisible: false,
                    }}
                  >
                    <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                    <Stack.Screen
                      name="auth"
                      options={Platform.select({
                        ios: {
                          presentation: "formSheet" as const,
                          sheetAllowedDetents: "fitToContents" as const,
                          sheetExpandsWhenScrolledToEdge: false,
                          headerLargeTitle: false,
                          headerTransparent: true,
                          headerStyle: { backgroundColor: "transparent" },
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
                      })}
                    />
                    <Stack.Screen
                      name="profile"
                      options={{
                        presentation: "modal",
                        headerLargeTitle: false,
                        headerTransparent: true,
                      }}
                    />
                  </Stack>
                  </DrawerProvider>
                </SyncProvider>
              </CashflowDataProvider>
            </SQLiteProvider>
          </Suspense>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </View>
  );
}
