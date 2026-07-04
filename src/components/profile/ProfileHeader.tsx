import { Pressable, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { AppText as RNText } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";

export function ProfileHeader({ onUpdatePhoto }: { onUpdatePhoto: () => void }) {
  const appTheme = useAppTheme();

  return (
    <View className="items-center justify-center pt-2">
      <Pressable
        className="relative h-24 w-24 items-center justify-center rounded-full"
        style={{ backgroundColor: appTheme.colors.primary }}
        onPress={onUpdatePhoto}
        accessibilityRole="button"
        accessibilityLabel="Update profile picture"
      >
        <RNText
          style={{
            color: appTheme.colors.inverseForeground,
            fontSize: appTheme.textSize * 2,
            fontWeight: "800",
            letterSpacing: appTheme.textSpacing,
          }}
        >
          EA
        </RNText>
        <View
          className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2"
          style={{
            backgroundColor: appTheme.colors.background,
            borderColor: appTheme.colors.background,
          }}
        >
          <SymbolView
            name="pencil.circle.fill"
            size={28}
            tintColor={appTheme.colors.primary}
            fallback={<RNText style={{ color: appTheme.colors.primary }}>✎</RNText>}
          />
        </View>
      </Pressable>

      <RNText
        className="mt-3"
        style={{ color: appTheme.colors.foreground, fontSize: appTheme.textSize + 5, fontWeight: "700", letterSpacing: appTheme.textSpacing }}
      >
        Ethos Account
      </RNText>
      <RNText style={appTheme.text.caption}>ethos.user@example.com</RNText>
    </View>
  );
}
