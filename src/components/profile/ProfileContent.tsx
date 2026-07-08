import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, View } from "react-native";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import * as Updates from "expo-updates";
import * as WebBrowser from "expo-web-browser";
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
import { useAuth } from "@/components/AuthProvider";
import { useAppTheme, type ThemeName } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { useSyncStatus } from "@/components/SyncProvider";
import { clearCashflowDatabase } from "@/data/cashflow/schema";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import { deleteAccount } from "@/lib/api/account";
import { updateProfile } from "@/lib/api/profile";
import { alpha } from "@/lib/color";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { pickUploadImage } from "@/lib/imageUpload";
import { clearPreferences } from "@/lib/preferences";
import { formatRelativeTime } from "@/lib/relativeTime";

const SETTINGS_ICON_SIZE = 15;
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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
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
    queueMicrotask(() => setDraftTextSize(appTheme.textSize));
  }, [appTheme.textSize]);

  useEffect(() => {
    draftTextSpacingRef.current = appTheme.textSpacing;
    queueMicrotask(() => setDraftTextSpacing(appTheme.textSpacing));
  }, [appTheme.textSpacing]);

  const showMockAction = (title: string) => {
    Alert.alert(title, t("profile.mockMessage"));
  };

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

  const deleteUserAccount = async () => {
    if (isDeletingAccount) return;

    setIsDeletingAccount(true);

    try {
      await deleteAccount();
      await clearCashflowDatabase(db);
      await clearPreferences();
      await cashflowData.refresh();
      try {
        await auth.signOut();
      } catch (error) {
        console.warn("Failed to clear auth session after account deletion", error);
      }
      Alert.alert(t("profile.accountDeletedTitle"), t("profile.accountDeletedMessage"));
      router.replace("/");
    } catch (error) {
      Alert.alert(t("profile.deleteAccountFailedTitle"), error instanceof Error ? error.message : t("profile.deleteAccountFailedMessage"));
    } finally {
      setIsDeletingAccount(false);
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

  const confirmDeleteAccount = () => {
    Alert.alert(
      t("profile.deleteConfirmTitle"),
      t("profile.deleteConfirmMessage"),
      [
        { text: t("profile.deleteConfirmCancel"), style: "cancel" },
        { text: t("profile.deleteConfirmDelete"), style: "destructive", onPress: () => void deleteUserAccount() },
      ],
    );
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

  const updateStatus = !Updates.isEnabled
    ? t("profile.updateStatusIncluded")
    : updates.isUpdatePending
      ? t("profile.updateStatusPending")
      : updates.isUpdateAvailable
        ? t("profile.updateStatusAvailable")
        : updates.isChecking || isCheckingForUpdate
          ? t("profile.updateStatusChecking")
          : t("profile.updateStatusUpToDate");
  const lastUpdateCheck = updates.lastCheckForUpdateTimeSinceRestart
    ? formatRelativeTime(updates.lastCheckForUpdateTimeSinceRestart)
    : t("profile.updateNotChecked");
  const syncStatusText = sync.status === "syncing"
    ? t("profile.syncStatusSyncing")
    : sync.status === "error"
      ? t("profile.syncStatusError")
      : t("profile.syncStatusLastSync", { time: formatRelativeTime(sync.lastSync) });
  const syncActionTitle = sync.status === "error"
    ? t("profile.syncActionRetry")
    : sync.status === "syncing"
      ? t("profile.syncStatusSyncing")
      : `${syncStatusText} - ${t("profile.syncActionNow")}`;

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
                      avatarUrl={auth.avatarUrl}
                      avatarSource={auth.avatarSource}
                      email={auth.email}
                      initials={auth.initials}
                      isUpdatingPhoto={isUpdatingPhoto}
                      name={auth.displayName}
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
              <Label
                title={auth.displayName}
                icon={<Image systemName="person.crop.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
                modifiers={[...rowModifiers, onTapGesture(() => showMockAction(t("profile.personalInformation")))]}
              />
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
              <Button
                onPress={sync.status === "syncing" ? undefined : () => void sync.syncNow()}
                modifiers={[...rowModifiers, tint(sync.status === "error" ? appTheme.colors.negative : appTheme.colors.primary)]}
              >
                <Label
                  title={syncActionTitle}
                  icon={<Image systemName="arrow.triangle.2.circlepath" size={SETTINGS_ICON_SIZE} color={sync.status === "error" ? appTheme.colors.negative : appTheme.colors.primary} />}
                />
              </Button>
            ) : null}
            {auth.isAuthenticated ? (
              <Button
                onPress={isDeletingAccount ? undefined : confirmDeleteAccount}
                modifiers={[...rowModifiers, tint(appTheme.colors.negative)]}
              >
                <Label
                  title={isDeletingAccount ? t("profile.deletingAccount") : t("profile.deleteAccount")}
                  icon={<Image systemName="trash" size={SETTINGS_ICON_SIZE} color={appTheme.colors.negative} />}
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
            <Slider
              value={draftTextSize}
              min={14}
              max={22}
              step={1}
              label={<Text>{t("profile.textSizeLabel", { value: appTheme.usesSystemTextSettings && !isEditingTextSize ? t("profile.system") : `${draftTextSize} pt` })}</Text>}
              onValueChange={updateDraftTextSize}
              onEditingChanged={commitDraftTextSize}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            />
            <Slider
              value={draftTextSpacing}
              min={-0.5}
              max={1.5}
              step={0.25}
              label={<Text>{t("profile.textSpacingLabel", { value: appTheme.usesSystemTextSettings && !isEditingTextSpacing ? t("profile.system") : draftTextSpacing.toFixed(2) })}</Text>}
              onValueChange={updateDraftTextSpacing}
              onEditingChanged={commitDraftTextSpacing}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            />
            <Button
              onPress={appTheme.resetTextSettings}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title={t("profile.useSystemTextSettings")}
                icon={<Image systemName="textformat.size" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              />
            </Button>
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

          <Section title={t("profile.updates")} footer={<Text>{t("profile.lastChecked", { time: lastUpdateCheck })}</Text>}>
            <Button
              onPress={checkForUpdates}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title={isCheckingForUpdate ? t("profile.checkingForUpdates") : t("profile.checkForUpdates")}
                icon={<Image systemName="arrow.clockwise.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              />
            </Button>
            <Label
              title={t("profile.statusLabel", { status: updateStatus })}
              icon={<Image systemName="icloud.and.arrow.down" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              modifiers={rowModifiers}
            />
            <Label
              title={t("profile.appVersion", { version: APP_VERSION })}
              icon={<Image systemName="info.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              modifiers={rowModifiers}
            />
          </Section>

          <Section title={t("profile.getHelp")} footer={<Text>{`${APP_NAME} ${APP_VERSION}`}</Text>}>
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
                title={`${t("profile.contactSupport")}: ${SUPPORT_EMAIL}`}
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
          {auth.isAuthenticated ? (
            <Section>
              <Button
                onPress={isDeletingAccount ? undefined : handleSignOut}
                modifiers={[...rowModifiers, tint(appTheme.colors.negative)]}
              >
                <Label
                  title={t("common.signOut")}
                  icon={<Image systemName="rectangle.portrait.and.arrow.right" size={SETTINGS_ICON_SIZE} color={appTheme.colors.negative} />}
                />
              </Button>
            </Section>
          ) : null}
        </Form>
      </Host>
    </View>
  );
}
