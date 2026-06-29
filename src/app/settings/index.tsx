import { useState, type ReactNode } from "react";
import { Alert, Appearance, Pressable, Switch, Text as RNText, View } from "react-native";
import { router, Stack } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { BottomSheet, Button, Column, FieldGroup, Host, RNHostView, Text } from "@expo/ui";
import { background, scrollContentBackground } from "@expo/ui/swift-ui/modifiers";
import { APP_NAME, APP_VERSION } from "@/config/app";
import { useTheme } from "@/components/ThemeContext";
import { useNativeTheme } from "@/components/useNativeTheme";

type SettingsRowProps = {
  icon: SFSymbol;
  title: string;
  subtitle?: string;
  value?: string;
  showChevron?: boolean;
  onPress?: () => void;
  trailing?: ReactNode;
};

function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  showChevron = false,
  onPress,
  trailing,
}: SettingsRowProps) {
  const nativeTheme = useNativeTheme();
  const Container = onPress ? Pressable : View;

  return (
    <Container
      className="flex-1 flex-row items-center gap-3"
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
    >
      <View
        className="h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: nativeTheme.colors.primary }}
      >
        <SymbolView
          name={icon}
          size={17}
          tintColor={nativeTheme.colors.inverseForeground}
          fallback={<RNText style={{ color: nativeTheme.colors.inverseForeground }}>•</RNText>}
        />
      </View>

      <View className="min-w-0 flex-1">
        <RNText numberOfLines={1} style={nativeTheme.text.body}>
          {title}
        </RNText>
        {subtitle ? (
          <RNText numberOfLines={1} style={nativeTheme.text.caption}>
            {subtitle}
          </RNText>
        ) : null}
      </View>

      {trailing ?? (
        <View className="flex-row items-center gap-2">
          {value ? (
            <RNText numberOfLines={1} style={nativeTheme.text.value}>
              {value}
            </RNText>
          ) : null}
          {showChevron ? <RNText style={nativeTheme.text.chevron}>›</RNText> : null}
        </View>
      )}
    </Container>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const nativeTheme = useNativeTheme();
  const [isSheetPresented, setIsSheetPresented] = useState(false);
  const [menuChoice, setMenuChoice] = useState("Default");

  const setDarkMode = (value: boolean) => {
    Appearance.setColorScheme(value ? "dark" : "light");
  };

  const showDialog = () => {
    Alert.alert("Native Dialog", "This is a React Native native alert launched from a settings row.", [
      { text: "Cancel", style: "cancel" },
      { text: "OK" },
    ]);
  };

  return (
    <Host style={{ flex: 1, backgroundColor: nativeTheme.colors.background }}>
      <Stack.Screen options={{ title: "Settings" }} />
      <FieldGroup
        style={{ backgroundColor: nativeTheme.colors.background }}
        modifiers={[
          scrollContentBackground("hidden"),
          background(nativeTheme.colors.background),
        ]}
      >
        <FieldGroup.Section title="Appearance">
          <RNHostView style={{ height: 52, width: "100%" }}>
            <SettingsRow
              icon="moon.fill"
              title="Dark Mode"
              trailing={
                <Switch
                  ios_backgroundColor={nativeTheme.switch.iosBackgroundColor}
                  thumbColor={nativeTheme.switch.thumbColor}
                  trackColor={nativeTheme.switch.trackColor}
                  value={nativeTheme.isDark}
                  onValueChange={setDarkMode}
                />
              }
            />
          </RNHostView>

          <RNHostView style={{ height: 52, width: "100%" }}>
            <SettingsRow
              icon="paintpalette.fill"
              title="Green Theme"
              value={theme === "green" ? "Selected" : undefined}
              onPress={() => setTheme("green")}
            />
          </RNHostView>

          <RNHostView style={{ height: 52, width: "100%" }}>
            <SettingsRow
              icon="paintbrush.pointed.fill"
              title="Blue Theme"
              value={theme === "blue" ? "Selected" : undefined}
              onPress={() => setTheme("blue")}
            />
          </RNHostView>

          <FieldGroup.SectionFooter>
            <Text textStyle={nativeTheme.text.footer}>
              These rows are React Native controls hosted inside Expo UI's native grouped form.
            </Text>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Native Actions">
          <RNHostView style={{ height: 52, width: "100%" }}>
            <SettingsRow
              icon="exclamationmark.bubble.fill"
              title="Open Dialog"
              showChevron
              onPress={showDialog}
            />
          </RNHostView>

          <RNHostView style={{ height: 52, width: "100%" }}>
            <SettingsRow
              icon="rectangle.bottomthird.inset.filled"
              title="Open Bottom Sheet"
              showChevron
              onPress={() => setIsSheetPresented(true)}
            />
          </RNHostView>

          <RNHostView style={{ height: 52, width: "100%" }}>
            <SettingsRow
              icon="ellipsis.circle.fill"
              title="Appearance Mode"
              value={menuChoice}
              onPress={() => {
                Alert.alert("Appearance Mode", "Choose a layout style.", [
                  { text: "Default", onPress: () => setMenuChoice("Default") },
                  { text: "Compact", onPress: () => setMenuChoice("Compact") },
                  { text: "Expanded", onPress: () => setMenuChoice("Expanded") },
                  { text: "Cancel", style: "cancel" },
                ]);
              }}
            />
          </RNHostView>

          <RNHostView style={{ height: 52, width: "100%" }}>
            <SettingsRow
              icon="slider.horizontal.3"
              title="Open Detail Screen"
              value="Advanced"
              showChevron
              onPress={() => router.push("/settings/detail")}
            />
          </RNHostView>
        </FieldGroup.Section>

        <FieldGroup.Section title="About">
          <Text textStyle={nativeTheme.text.body}>{APP_NAME}</Text>
          <Text textStyle={nativeTheme.text.muted}>{`Version ${APP_VERSION}`}</Text>
        </FieldGroup.Section>
      </FieldGroup>

      <BottomSheet
        isPresented={isSheetPresented}
        onDismiss={() => setIsSheetPresented(false)}
        snapPoints={["half", "full"]}
      >
        <Column spacing={12} style={{ padding: 8 }}>
          <Text textStyle={{ color: nativeTheme.colors.foreground, fontSize: 20, fontWeight: "700" }}>
            Bottom Sheet
          </Text>
          <Text textStyle={nativeTheme.text.body}>
            This is Expo UI's universal BottomSheet opened from a custom settings row.
          </Text>
          <Button label="Close" onPress={() => setIsSheetPresented(false)} />
        </Column>
      </BottomSheet>
    </Host>
  );
}
