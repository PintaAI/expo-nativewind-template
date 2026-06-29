import { useColorScheme } from "react-native";
import { useTheme } from "./ThemeContext";
import { themes } from "./ThemeProvider";

export function useNativeTheme() {
  const { theme } = useTheme();
  const colorScheme = useColorScheme();
  const resolvedScheme = colorScheme === "dark" ? "dark" : "light";
  const vars = themes[theme][resolvedScheme];

  const colors = {
    primary: vars["--color-primary"],
    secondary: vars["--color-secondary"],
    muted: vars["--color-muted"],
    background: vars["--color-background"],
    foreground: vars["--color-foreground"],
    inverseForeground: resolvedScheme === "dark" ? "#000000" : "#ffffff",
    overlay: resolvedScheme === "dark" ? "rgba(0,0,0,0.28)" : "rgba(15,23,42,0.16)",
    switchTrackOff: resolvedScheme === "dark" ? "#3a3a3c" : "#d1d5db",
    switchThumb: "#ffffff",
  };

  return {
    theme,
    colorScheme,
    resolvedScheme,
    isDark: resolvedScheme === "dark",
    vars,
    colors,
    text: {
      body: { color: colors.foreground, fontSize: 17 },
      muted: { color: colors.muted, fontSize: 17 },
      caption: { color: colors.muted, fontSize: 13 },
      footer: { color: colors.muted, fontSize: 13 },
      value: { color: colors.muted, fontSize: 16 },
      chevron: { color: colors.muted, fontSize: 17 },
      selected: { color: colors.primary, fontSize: 17 },
    },
    switch: {
      trackColor: { false: colors.switchTrackOff, true: colors.primary },
      thumbColor: colors.switchThumb,
      iosBackgroundColor: colors.switchTrackOff,
    },
  };
}
