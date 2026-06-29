import { VariableContextProvider } from "nativewind";
import { useColorScheme } from "react-native";
import { ThemeName, useTheme } from "./ThemeContext";

export type ThemeVars = Record<string, string>;

export type ThemeSet = {
  light: ThemeVars;
  dark: ThemeVars;
};

export const themes: Record<ThemeName, ThemeSet> = {
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

export function CssThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const scheme = useColorScheme();
  const resolvedScheme = scheme === "dark" ? "dark" : "light";
  return (
    <VariableContextProvider value={themes[theme][resolvedScheme]}>
      {children}
    </VariableContextProvider>
  );
}
