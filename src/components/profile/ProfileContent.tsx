import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, View } from "react-native";
import { router, type Href } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import * as Updates from "expo-updates";
import * as WebBrowser from "expo-web-browser";
import { Button, Form, Host, Image, Label, LabeledContent, Picker, RNHostView, Section, Text, Toggle } from "@expo/ui/swift-ui";
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
import { useAuth } from "@/components/AuthProvider";
import { useAppTheme, type ThemeName } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { useSyncStatus } from "@/components/SyncProvider";
import { clearCashflowDatabase } from "@/data/cashflow/schema";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import { updateProfile } from "@/lib/api/profile";
import { alpha } from "@/lib/color";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { pickUploadImage } from "@/lib/imageUpload";
import { clearPreferences } from "@/lib/preferences";
import { formatRelativeTime } from "@/lib/relativeTime";

const SETTINGS_ICON_SIZE = 15;
const ACCOUNT_ROUTE = "/(cashflow)/(tabs)/profile/account" as Href;
const FONT_SETTINGS_ROUTE = "/(cashflow)/(tabs)/profile/font-settings" as Href;
const PRIVACY_POLICY_URL = "https://cashflow-notion.vercel.app/privacy";
const SUPPORT_EMAIL = "rorezxez@gmail.com";

export function ProfileContent() {
  const appTheme = useAppTheme();
  const auth = useAuth();
  const db = useSQLiteContext();
  const cashflowData = useCashflowData();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = appTheme;
  const { currency, setCurrency } = useCurrency();
  const sync = useSyncStatus();
  const updates = Updates.useUpdates();
  const [isCheckingForUpdate, setIsCheckingForUpdate] = useState(false);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const rowBackground = alpha(appTheme.colors.muted, appTheme.isDark ? 0.18 : 0.1);
  const profileHeaderVerticalPadding = Math.max(16, Math.round(appTheme.textSize * 1.1));
  const rowModifiers = [listRowBackground(rowBackground)];

  const updateProfilePhoto = async () => {
    if (!auth.isAuthenticated || isUpdatingPhoto) return;

    setIsUpdatingPhoto(true);
    try {
      const pickedImage = await pickUploadImage([1, 1]);
      if (!pickedImage) return;

      await updateProfile(auth.displayName, pickedImage);
      await auth.refresh();
    } catch (error) {
      Alert.alert(t("profile.photoUploadFailedTitle"), error instanceof Error ? error.message : t("profile.photoUploadFailedMessage"));
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const checkForUpdates = async () => {
    if (!Updates.isEnabled) {
      Alert.alert(t("profile.updatesUnavailableTitle"), t("profile.updatesUnavailableMessage"));
      return;
    }

    setIsCheckingForUpdate(true);

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable || update.isRollBackToEmbedded) {
        await Updates.fetchUpdateAsync();
        Alert.alert(t("profile.updateReadyTitle"), t("profile.updateReadyMessage"), [
          { text: t("profile.updateReadyLater"), style: "cancel" },
          { text: t("profile.updateReadyRestart"), onPress: () => void Updates.reloadAsync() },
        ]);
        return;
      }

      Alert.alert(t("profile.upToDateTitle"), t("profile.upToDateMessage"));
    } catch (error) {
      Alert.alert(t("profile.updateCheckFailedTitle"), error instanceof Error ? error.message : t("profile.updateCheckFailedMessage"));
    } finally {
      setIsCheckingForUpdate(false);
    }
  };

  const openPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL, {
        dismissButtonStyle: "done",
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (error) {
      Alert.alert(t("profile.privacyPolicyErrorTitle"), error instanceof Error ? error.message : t("profile.privacyPolicyErrorMessage"));
    }
  };

  const contactSupport = async () => {
    const subject = encodeURIComponent("Ethos Support");
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;

    try {
      const canOpenMail = await Linking.canOpenURL(url);
      if (!canOpenMail) {
        Alert.alert(t("profile.contactSupport"), SUPPORT_EMAIL);
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(t("profile.contactSupport"), error instanceof Error ? error.message : SUPPORT_EMAIL);
    }
  };

  const handleSignOut = async () => {
    try {
      await clearCashflowDatabase(db);
      await clearPreferences();
      await cashflowData.refresh();
    } catch (error) {
      console.warn("Failed to clear local data on sign out", error);
    }
    try {
      await auth.signOut();
    } catch (error) {
      console.warn("Failed to sign out", error);
    }
    router.replace("/");
  };

  const setDarkMode = (value: boolean) => {
    appTheme.setColorScheme(value ? "dark" : "light");
  };

  const updateStatus = !Updates.isEnabled
    ? t("profile.updateStatusIncluded")
    : updates.isUpdatePending
      ? t("profile.updateStatusPending")
      : updates.isUpdateAvailable
        ? t("profile.updateStatusAvailable")
        : updates.isChecking || isCheckingForUpdate
          ? t("profile.updateStatusChecking")
          : t("profile.updateStatusUpToDate");
  const syncActionLabel = sync.status === "syncing"
    ? t("profile.syncStatusSyncing")
    : sync.status === "error"
      ? t("profile.syncActionRetry")
      : t("profile.syncActionNow");
  const syncDetail = sync.status === "error"
    ? t("profile.syncStatusError")
    : sync.status === "syncing"
      ? ""
      : t("profile.syncStatusLastSync", { time: formatRelativeTime(sync.lastSync) });

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
                    <ProfileHeader
                      avatarSource={auth.avatarSource}
                      initials={auth.initials}
                      isUpdatingPhoto={isUpdatingPhoto}
                      onUpdatePhoto={updateProfilePhoto}
                    />
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

          <Section title={t("profile.account")}>
            {auth.isAuthenticated ? (
              <LabeledContent
                label={
                  <Label
                    title={auth.displayName}
                    icon={<Image systemName="person.crop.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
                  />
                }
                modifiers={[...rowModifiers, onTapGesture(() => router.push(ACCOUNT_ROUTE))]}
              >
                <Text>{auth.email}</Text>
              </LabeledContent>
            ) : null}
            {!auth.isAuthenticated ? (
              <Button
                onPress={() => router.push("/auth")}
                modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
              >
                <Label
                  title={t("common.signIn")}
                  icon={<Image systemName="person.badge.key" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
                />
              </Button>
            ) : null}
            {auth.isAuthenticated ? (
              <LabeledContent
                label={
                  <Label
                    title={syncActionLabel}
                    icon={<Image systemName="arrow.triangle.2.circlepath" size={SETTINGS_ICON_SIZE} color={sync.status === "error" ? appTheme.colors.negative : appTheme.colors.primary} />}
                  />
                }
                modifiers={[
                  ...rowModifiers,
                  tint(sync.status === "error" ? appTheme.colors.negative : appTheme.colors.primary),
                  ...(sync.status === "syncing" ? [] : [onTapGesture(() => void sync.syncNow())]),
                ]}
              >
                <Text>{syncDetail}</Text>
              </LabeledContent>
            ) : null}
            {auth.isAuthenticated ? (
              <Button
                onPress={handleSignOut}
                modifiers={[...rowModifiers, tint(appTheme.colors.negative)]}
              >
                <Label
                  title={t("common.signOut")}
                  icon={<Image systemName="rectangle.portrait.and.arrow.right" size={SETTINGS_ICON_SIZE} color={appTheme.colors.negative} />}
                />
              </Button>
            ) : null}
          </Section>

          <Section title={t("profile.appearance")}>
            <Toggle
              isOn={appTheme.isDark}
              onIsOnChange={setDarkMode}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title={t("profile.darkMode")}
                icon={<Image systemName="moon" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              />
            </Toggle>
            <Picker
              label={
                <Label
                  title={t("profile.accentColor")}
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
            <LabeledContent
              label={
                <Label
                  title="Font"
                  icon={<Image systemName="textformat.size" size={SETTINGS_ICON_SIZE} />}
                />
              }
              modifiers={[...rowModifiers, onTapGesture(() => router.push(FONT_SETTINGS_ROUTE))]}
            >
              <Text />
            </LabeledContent>
          </Section>

          <Section title={t("profile.app")}>
            <Picker
              label={
                <Label
                  title={t("profile.currency")}
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
                  title={t("language.label")}
                  icon={<Image systemName="globe" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
                />
              }
              selection={i18n.resolvedLanguage || "en"}
              onSelectionChange={(value) => i18n.changeLanguage(String(value))}
              modifiers={[...rowModifiers, pickerStyle("menu"), tint(appTheme.colors.primary)]}
            >
              <Text modifiers={[tag("en")]}>{t("language.english")}</Text>
              <Text modifiers={[tag("id")]}>{t("language.indonesia")}</Text>
            </Picker>
          </Section>

          <Section title={t("profile.updates")}>
            <LabeledContent
              label={
                <Label
                  title={isCheckingForUpdate ? t("profile.checkingForUpdates") : t("profile.checkForUpdates")}
                  icon={<Image systemName="arrow.clockwise.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
                />
              }
              modifiers={[
                ...rowModifiers,
                tint(appTheme.colors.primary),
                ...(isCheckingForUpdate ? [] : [onTapGesture(() => void checkForUpdates())]),
              ]}
            >
              <Text>{updateStatus}</Text>
            </LabeledContent>
            <LabeledContent
              label={
                <Label
                  title={t("profile.appVersion", { version: APP_VERSION })}
                  icon={<Image systemName="info.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
                />
              }
              modifiers={rowModifiers}
            >
              <Text>{APP_VERSION}</Text>
            </LabeledContent>
          </Section>

          <Section title={t("profile.getHelp")}>
            <Button
              onPress={() => void openPrivacyPolicy()}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title={t("profile.privacyPolicy")}
                icon={<Image systemName="hand.raised" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              />
            </Button>
            <Button
              onPress={() => void contactSupport()}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title={t("profile.contactSupport")}
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
