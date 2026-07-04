import "../global.css";
import { ThemeProvider, DefaultTheme, DarkTheme, Stack } from "expo-router";
import { AppThemeProvider, useAppTheme } from "@/components/AppTheme";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { DrawerProvider } from "@/components/DrawerContext";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
        <CurrencyProvider>
          <DrawerProvider>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: appTheme.colors.background },
                headerStyle: { backgroundColor: appTheme.colors.background },
                headerTintColor: appTheme.colors.foreground,
                headerShadowVisible: false,
              }}
            >
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
        </CurrencyProvider>
      </ThemeProvider>
    </View>
  );
}
