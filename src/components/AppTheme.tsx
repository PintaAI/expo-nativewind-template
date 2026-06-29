import { VariableContextProvider } from "nativewind";
import { createContext, use, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

export type ThemeName = "green" | "blue";

type ThemeVars = Record<string, string>;

type ThemeSet = {
  light: ThemeVars;
  dark: ThemeVars;
};

type AppThemeContextType = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

const themes: Record<ThemeName, ThemeSet> = {
  green: {
    light: {
      "--color-primary": "#22c55e",
      "--color-secondary": "#a855f7",
      "--color-muted": "#64748b",
      "--color-background": "#f7fdf9",
      "--color-foreground": "#000000",
    },
    dark: {
      "--color-primary": "#4ade80",
      "--color-secondary": "#c084fc",
      "--color-muted": "#a1a1aa",
      "--color-background": "#060d08",
      "--color-foreground": "#ffffff",
    },
  },
  blue: {
    light: {
      "--color-primary": "#3b82f6",
      "--color-secondary": "#8b5cf6",
      "--color-muted": "#64748b",
      "--color-background": "#f7f8fd",
      "--color-foreground": "#000000",
    },
    dark: {
      "--color-primary": "#60a5fa",
      "--color-secondary": "#a78bfa",
      "--color-muted": "#a1a1aa",
      "--color-background": "#06080d",
      "--color-foreground": "#ffffff",
    },
  },
};

const AppThemeContext = createContext<AppThemeContextType>({
  theme: "green",
  setTheme: () => {},
});

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("green");
  const colorScheme = useColorScheme();
  const resolvedScheme = colorScheme === "dark" ? "dark" : "light";

  return (
    <AppThemeContext value={{ theme, setTheme }}>
      <VariableContextProvider value={themes[theme][resolvedScheme]}>
        {children}
      </VariableContextProvider>
    </AppThemeContext>
  );
}

export function useTheme() {
  return use(AppThemeContext);
}

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
