import { useEffect, useRef, useState } from "react";
import { Alert, View } from "react-native";
import { Button, Form, Host, Image, Label, Picker, RNHostView, Section, Slider, Text, Toggle } from "@expo/ui/swift-ui";
import {
  background,
  environment,
  font,
  frame,
  hidden,
  kerning,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  onTapGesture,
  pickerStyle,
  scrollContentBackground,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { APP_NAME, APP_VERSION } from "@/config/app";
import { useAppTheme, type ThemeName } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { alpha } from "@/lib/color";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";

const SETTINGS_ICON_SIZE = 15;

export function ProfileContent() {
  const appTheme = useAppTheme();
  const { theme, setTheme } = appTheme;
  const { currency, setCurrency } = useCurrency();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [draftTextSize, setDraftTextSize] = useState(appTheme.textSize);
  const [draftTextSpacing, setDraftTextSpacing] = useState(appTheme.textSpacing);
  const [isEditingTextSize, setIsEditingTextSize] = useState(false);
  const [isEditingTextSpacing, setIsEditingTextSpacing] = useState(false);
  const draftTextSizeRef = useRef(appTheme.textSize);
  const draftTextSpacingRef = useRef(appTheme.textSpacing);
  const rowBackground = alpha(appTheme.colors.muted, appTheme.isDark ? 0.18 : 0.1);
  const profileHeaderVerticalPadding = Math.max(16, Math.round(appTheme.textSize * 1.1));
  const rowModifiers = [listRowBackground(rowBackground)];

  useEffect(() => {
    draftTextSizeRef.current = appTheme.textSize;
    setDraftTextSize(appTheme.textSize);
  }, [appTheme.textSize]);

  useEffect(() => {
    draftTextSpacingRef.current = appTheme.textSpacing;
    setDraftTextSpacing(appTheme.textSpacing);
  }, [appTheme.textSpacing]);

  const showMockAction = (title: string) => {
    Alert.alert(title, "This is mock UI for now. Functionality will be connected later.");
  };

  const setDarkMode = (value: boolean) => {
    appTheme.setColorScheme(value ? "dark" : "light");
  };

  const updateDraftTextSize = (value: number) => {
    draftTextSizeRef.current = value;
    setDraftTextSize(value);
  };

  const updateDraftTextSpacing = (value: number) => {
    draftTextSpacingRef.current = value;
    setDraftTextSpacing(value);
  };

  const commitDraftTextSize = (isEditing: boolean) => {
    setIsEditingTextSize(isEditing);

    if (!isEditing) {
      appTheme.setTextSize(draftTextSizeRef.current);
    }
  };

  const commitDraftTextSpacing = (isEditing: boolean) => {
    setIsEditingTextSpacing(isEditing);

    if (!isEditing) {
      appTheme.setTextSpacing(draftTextSpacingRef.current);
    }
  };

  return (
    <View
      collapsable={false}
      className="flex-1"
      style={{ backgroundColor: appTheme.colors.background }}
    >
      <Host
        useViewportSizeMeasurement
        style={{ flex: 1, backgroundColor: appTheme.colors.background }}
        modifiers={[
          environment("colorScheme", appTheme.resolvedScheme),
          ...(appTheme.usesSystemTextSettings ? [] : [font({ size: appTheme.textSize }), kerning(appTheme.textSpacing)]),
        ]}
      >
        <Form
          modifiers={[
            scrollContentBackground("hidden"),
            background(appTheme.colors.background),
          ]}
        >
          <Section
            header={
              <RNHostView matchContents>
                <View
                  className="px-4"
                  style={{
                    backgroundColor: appTheme.colors.background,
                    paddingBottom: Math.max(8, Math.round(appTheme.textSize * 0.55)),
                    paddingTop: profileHeaderVerticalPadding,
                  }}
                >
                  <ProfileHeader onUpdatePhoto={() => showMockAction("Update profile picture")} />
                </View>
              </RNHostView>
            }
          >
            <Text
              modifiers={[
                hidden(),
                frame({ height: 0 }),
                listRowBackground(rowBackground),
                listRowInsets({ top: 0, bottom: 0, leading: 0, trailing: 0 }),
                listRowSeparator("hidden"),
              ]}
            />
          </Section>

          <Section title="Account">
            <Label
              title="Profile"
              icon={<Image systemName="person.crop.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              modifiers={[...rowModifiers, onTapGesture(() => showMockAction("Personal Information"))]}
            />
            <Label
              title="Security"
              icon={<Image systemName="lock.shield" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              modifiers={[...rowModifiers, onTapGesture(() => showMockAction("Security"))]}
            />
            <Toggle
              isOn={biometricsEnabled}
              onIsOnChange={setBiometricsEnabled}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title="Biometric Unlock"
                icon={<Image systemName="faceid" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              />
            </Toggle>
          </Section>

          <Section title="Appearance">
            <Toggle
              isOn={appTheme.isDark}
              onIsOnChange={setDarkMode}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title="Dark Mode"
                icon={<Image systemName="moon" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              />
            </Toggle>
            <Picker
              label={
                <Label
                  title="Accent Color"
                  icon={<Image systemName="paintpalette" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
                />
              }
              selection={theme}
              onSelectionChange={(value) => setTheme(value as ThemeName)}
              modifiers={[...rowModifiers, pickerStyle("menu"), tint(appTheme.colors.primary)]}
            >
              {appTheme.availableThemes.map((option) => (
                <Text key={option.slug} modifiers={[tag(option.slug)]}>
                  {option.name}
                </Text>
              ))}
            </Picker>
            <Slider
              value={draftTextSize}
              min={14}
              max={22}
              step={1}
              label={<Text>{`Text Size: ${appTheme.usesSystemTextSettings && !isEditingTextSize ? "System" : `${draftTextSize} pt`}`}</Text>}
              onValueChange={updateDraftTextSize}
              onEditingChanged={commitDraftTextSize}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            />
            <Slider
              value={draftTextSpacing}
              min={-0.5}
              max={1.5}
              step={0.25}
              label={<Text>{`Text Spacing: ${appTheme.usesSystemTextSettings && !isEditingTextSpacing ? "System" : draftTextSpacing.toFixed(2)}`}</Text>}
              onValueChange={updateDraftTextSpacing}
              onEditingChanged={commitDraftTextSpacing}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            />
            <Button
              onPress={appTheme.resetTextSettings}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title="Use System Text Settings"
                icon={<Image systemName="textformat.size" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              />
            </Button>
          </Section>

          <Section title="App">
            <Toggle
              isOn={notificationsEnabled}
              onIsOnChange={setNotificationsEnabled}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title="Notifications"
                icon={<Image systemName="bell.badge" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              />
            </Toggle>
            <Picker
              label={
                <Label
                  title="Currency"
                  icon={<Image systemName="dollarsign.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
                />
              }
              selection={currency}
              onSelectionChange={(value) => setCurrency(String(value))}
              modifiers={[...rowModifiers, pickerStyle("menu"), tint(appTheme.colors.primary)]}
            >
              {SUPPORTED_CURRENCIES.map((option) => (
                <Text key={option.code} modifiers={[tag(option.code)]}>
                  {`${option.flag} ${option.code}`}
                </Text>
              ))}
            </Picker>
            <Picker
              label={
                <Label
                  title="Language"
                  icon={<Image systemName="globe" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
                />
              }
              selection="English"
              onSelectionChange={() => showMockAction("Language")}
              modifiers={[...rowModifiers, pickerStyle("menu"), tint(appTheme.colors.primary)]}
            >
              <Text modifiers={[tag("English")]}>English</Text>
            </Picker>
          </Section>

          <Section title="Get Help" footer={<Text>{`${APP_NAME} ${APP_VERSION}`}</Text>}>
            <Button
              onPress={() => showMockAction("Help Center")}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title="Help Center"
                icon={<Image systemName="questionmark.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              />
            </Button>
            <Button
              onPress={() => showMockAction("Contact Support")}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title="Contact Support"
                icon={
                  <Image
                    systemName="bubble.left.and.bubble.right"
                    size={SETTINGS_ICON_SIZE}
                    color={appTheme.colors.primary}
                  />
                }
              />
            </Button>
          </Section>
        </Form>
      </Host>
    </View>
  );
}
