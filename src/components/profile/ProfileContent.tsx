import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import * as Updates from "expo-updates";
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
import { AppText } from "@/components/AppText";
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
import { appendUploadImage, pickUploadImage } from "@/lib/imageUpload";
import { clearPreferences } from "@/lib/preferences";
import { formatRelativeTime } from "@/lib/relativeTime";

const SETTINGS_ICON_SIZE = 15;

function formatUpdateDate(date: Date | undefined) {
  if (!date) return "Unavailable";

  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatUpdateId(updateId: string | undefined) {
  return updateId ? updateId.slice(0, 8) : "Embedded build";
}

export function ProfileContent() {
  const appTheme = useAppTheme();
  const auth = useAuth();
  const db = useSQLiteContext();
  const cashflowData = useCashflowData();
  const { theme, setTheme } = appTheme;
  const { currency, setCurrency } = useCurrency();
  const sync = useSyncStatus();
  const updates = Updates.useUpdates();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
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
    Alert.alert(title, "This is mock UI for now. Functionality will be connected later.");
  };

  const updateProfilePhoto = async () => {
    if (!auth.isAuthenticated || isUpdatingPhoto) return;

    setIsUpdatingPhoto(true);
    try {
      const pickedImage = await pickUploadImage([1, 1]);
      if (!pickedImage) return;

      const formData = new FormData();
      formData.set("name", auth.displayName);
      appendUploadImage(formData, "image", pickedImage);

      await updateProfile(formData);
      await auth.refresh();
    } catch (error) {
      Alert.alert("Photo upload failed", error instanceof Error ? error.message : "Unable to upload your profile photo right now.");
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const checkForUpdates = async () => {
    if (!Updates.isEnabled) {
      Alert.alert("Updates unavailable", "OTA update checks are only available in release builds with expo-updates enabled.");
      return;
    }

    setIsCheckingForUpdate(true);

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable || update.isRollBackToEmbedded) {
        await Updates.fetchUpdateAsync();
        Alert.alert("Update ready", "A new update has been downloaded and can be applied now.", [
          { text: "Later", style: "cancel" },
          { text: "Restart", onPress: () => void Updates.reloadAsync() },
        ]);
        return;
      }

      Alert.alert("Up to date", "You already have the latest available update for this build.");
    } catch (error) {
      Alert.alert("Update check failed", error instanceof Error ? error.message : "Unable to check for updates right now.");
    } finally {
      setIsCheckingForUpdate(false);
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
      Alert.alert("Account deleted", "Your account and stored app data have been removed.");
      router.replace("/");
    } catch (error) {
      Alert.alert("Could not delete account", error instanceof Error ? error.message : "Please try again later.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "This permanently removes your account, sessions, private wallets, notes, API key, push subscriptions, and local app data from this device.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Account", style: "destructive", onPress: () => void deleteUserAccount() },
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
    ? "Unavailable in this build"
    : updates.isUpdatePending
      ? "Downloaded, restart available"
      : updates.isUpdateAvailable
        ? "Update available"
        : updates.isChecking || isCheckingForUpdate
          ? "Checking..."
          : "Up to date";
  const updateChannel = Updates.channel ?? "None";
  const updateRuntime = Updates.runtimeVersion ?? "Unavailable";
  const currentUpdate = formatUpdateId(updates.currentlyRunning.updateId);
  const currentUpdateDate = formatUpdateDate(updates.currentlyRunning.createdAt);
  const lastUpdateCheck = updates.lastCheckForUpdateTimeSinceRestart
    ? formatRelativeTime(updates.lastCheckForUpdateTimeSinceRestart)
    : "Not checked this session";

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

          <Section title="Account">
            {auth.isAuthenticated ? (
              <Label
                title={auth.displayName}
                icon={<Image systemName="person.crop.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
                modifiers={[...rowModifiers, onTapGesture(() => showMockAction("Personal Information"))]}
              />
            ) : null}
            <Button
              onPress={auth.isAuthenticated ? isDeletingAccount ? undefined : auth.signOut : () => router.push("/auth")}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title={auth.isAuthenticated ? "Sign Out" : "Sign In"}
                icon={<Image systemName={auth.isAuthenticated ? "rectangle.portrait.and.arrow.right" : "person.badge.key"} size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              />
            </Button>
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
            {auth.isAuthenticated ? (
              <Button
                onPress={isDeletingAccount ? undefined : confirmDeleteAccount}
                modifiers={[...rowModifiers, tint(appTheme.colors.negative)]}
              >
                <Label
                  title={isDeletingAccount ? "Deleting Account" : "Delete Account"}
                  icon={<Image systemName="trash" size={SETTINGS_ICON_SIZE} color={appTheme.colors.negative} />}
                />
              </Button>
            ) : null}
          </Section>

          {auth.isAuthenticated ? (
            <Section
              header={
                <RNHostView matchContents>
                  <View
                    className="flex-row items-center justify-between px-4"
                    style={{
                      backgroundColor: appTheme.colors.background,
                      paddingBottom: Math.max(6, Math.round(appTheme.textSize * 0.4)),
                      paddingTop: Math.max(6, Math.round(appTheme.textSize * 0.4)),
                    }}
                  >
                    <View className="flex-row items-center gap-2">
                      {sync.status === "syncing" ? (
                        <ActivityIndicator size="small" color={appTheme.colors.muted} />
                      ) : null}
                      <AppText style={appTheme.text.caption}>Last sync</AppText>
                      <AppText
                        style={{
                          color:
                            sync.status === "error" ? appTheme.colors.negative : appTheme.colors.foreground,
                          fontSize: appTheme.textSize - 1,
                          letterSpacing: appTheme.textSpacing,
                        }}
                      >
                        {sync.status === "syncing"
                          ? "Syncing…"
                          : sync.status === "error"
                            ? "Sync failed"
                            : formatRelativeTime(sync.lastSync)}
                      </AppText>
                    </View>
                    <Pressable
                      onPress={sync.status === "syncing" ? undefined : () => void sync.syncNow()}
                      disabled={sync.status === "syncing"}
                      accessibilityRole="button"
                      accessibilityLabel={sync.status === "error" ? "Retry sync" : "Sync now"}
                    >
                      <AppText
                        style={{
                          color: sync.status === "error" ? appTheme.colors.negative : appTheme.colors.primary,
                          fontSize: appTheme.textSize - 1,
                          fontWeight: "600",
                          letterSpacing: appTheme.textSpacing,
                          opacity: sync.status === "syncing" ? 0.4 : 1,
                        }}
                      >
                        {sync.status === "error" ? "Retry" : "Sync now"}
                      </AppText>
                    </Pressable>
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
          ) : null}

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

          <Section title="Updates" footer={<Text>{`Last checked: ${lastUpdateCheck}`}</Text>}>
            <Button
              onPress={checkForUpdates}
              modifiers={[...rowModifiers, tint(appTheme.colors.primary)]}
            >
              <Label
                title={isCheckingForUpdate ? "Checking for Updates" : "Check for Updates"}
                icon={<Image systemName="arrow.clockwise.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              />
            </Button>
            <Label
              title={`Status: ${updateStatus}`}
              icon={<Image systemName="icloud.and.arrow.down" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              modifiers={rowModifiers}
            />
            <Label
              title={`Channel: ${updateChannel}`}
              icon={<Image systemName="point.3.connected.trianglepath.dotted" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              modifiers={rowModifiers}
            />
            <Label
              title={`Runtime: ${updateRuntime}`}
              icon={<Image systemName="shippingbox" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              modifiers={rowModifiers}
            />
            <Label
              title={`Current update: ${currentUpdate}`}
              icon={<Image systemName="info.circle" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              modifiers={rowModifiers}
            />
            <Label
              title={`Installed: ${currentUpdateDate}`}
              icon={<Image systemName="calendar" size={SETTINGS_ICON_SIZE} color={appTheme.colors.primary} />}
              modifiers={rowModifiers}
            />
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
