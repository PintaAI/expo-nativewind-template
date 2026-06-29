import "../global.css";
import { ThemeProvider, DefaultTheme, DarkTheme } from "expo-router";
import { CssThemeProvider } from "@/components/ThemeProvider";
import { ThemeContextProvider } from "@/components/ThemeContext";
import AppTabs from "@/components/AppTabs";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <ThemeContextProvider>
          <CssThemeProvider>
            <AppTabs />
          </CssThemeProvider>
        </ThemeContextProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
