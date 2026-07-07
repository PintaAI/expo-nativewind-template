import { Pressable, View } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { alpha } from "@/lib/color";

type IconSelectorProps = {
  options: readonly SFSymbol[];
  value: SFSymbol;
  onChange: (value: SFSymbol) => void;
  tintColor?: string;
};

export function IconSelector({ options, value, onChange, tintColor }: IconSelectorProps) {
  const appTheme = useAppTheme();
  const activeColor = tintColor ?? appTheme.colors.primary;
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option;
        const iconColor = selected ? activeColor : appTheme.colors.muted;

        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            className="h-11 w-11 items-center justify-center rounded-2xl border"
            style={{ backgroundColor: selected ? alpha(activeColor, 0.18) : appTheme.colors.background, borderColor: selected ? activeColor : borderColor }}
          >
            <SymbolView name={option} size={18} tintColor={iconColor} fallback={<Text style={{ color: iconColor }}>•</Text>} />
          </Pressable>
        );
      })}
    </View>
  );
}
