import { ActivityIndicator, Pressable, View } from "react-native";
import { Image, type ImageSource } from "expo-image";
import { SymbolView } from "expo-symbols";
import { AppText as RNText } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";

type ProfileHeaderProps = {
  avatarUrl: string | null;
  avatarSource: ImageSource | null;
  email: string;
  initials: string;
  isUpdatingPhoto?: boolean;
  name: string;
  onUpdatePhoto: () => void;
};

export function ProfileHeader({ avatarSource, email, initials, isUpdatingPhoto = false, name, onUpdatePhoto }: ProfileHeaderProps) {
  const appTheme = useAppTheme();

  return (
    <View className="items-center justify-center pt-2">
      <Pressable
        className="relative h-24 w-24 items-center justify-center"
        onPress={onUpdatePhoto}
        disabled={isUpdatingPhoto}
        accessibilityRole="button"
        accessibilityLabel="Update profile picture"
        style={{ opacity: isUpdatingPhoto ? 0.7 : 1 }}
      >
        <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: appTheme.colors.primary }}>
          {avatarSource ? (
            <Image source={avatarSource} contentFit="cover" style={{ height: "100%", width: "100%" }} />
          ) : (
            <RNText
              style={{
                color: appTheme.colors.inverseForeground,
                fontSize: appTheme.textSize * 2,
                fontWeight: "800",
                letterSpacing: appTheme.textSpacing,
              }}
            >
              {initials}
            </RNText>
          )}
        </View>
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
        {isUpdatingPhoto ? (
          <View className="absolute inset-0 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.24)" }}>
            <ActivityIndicator color={appTheme.colors.inverseForeground} />
          </View>
        ) : null}
      </Pressable>

      <RNText
        className="mt-3"
        style={{ color: appTheme.colors.foreground, fontSize: appTheme.textSize + 5, fontWeight: "700", letterSpacing: appTheme.textSpacing }}
      >
        {name}
      </RNText>
      <RNText style={appTheme.text.caption}>{email || "Not signed in"}</RNText>
    </View>
  );
}
