import type { ImageSource } from "expo-image";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { APP_VERSION } from "@/config/app";
import { alpha } from "@/lib/color";

export type ProfileContentBodyProps = {
  isAuthenticated: boolean;
  displayName: string;
  email: string;
  initials: string;
  avatarSource: ImageSource | null;
  syncStatus: string;
  syncActionLabel: string;
  syncDetail: string;
  updateStatus: string;
  isCheckingForUpdate: boolean;
  isUpdatingPhoto: boolean;
  onSignOut: () => void;
  onSyncNow: () => void;
  onCheckForUpdates: () => void;
  onUpdatePhoto: () => void;
  onOpenPrivacyPolicy: () => void;
  onContactSupport: () => void;
  onOpenAccount: () => void;
  onOpenFontSettings: () => void;
  onOpenAuth: () => void;
  onOpenOnboarding: () => void;
};

export function ProfileContentBody(props: ProfileContentBodyProps) {
  const appTheme = useAppTheme();
  const { t } = useTranslation();
  const rowColor = alpha(appTheme.colors.muted, appTheme.isDark ? 0.18 : 0.1);

  const Row = ({ label, detail, onPress, destructive = false }: {
    label: string;
    detail?: string;
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <Pressable
      accessibilityRole="button"
      className="min-h-14 flex-row items-center justify-between px-4 py-3"
      onPress={onPress}
      style={{ backgroundColor: rowColor }}
    >
      <Text className="font-semibold" style={{ color: destructive ? appTheme.colors.negative : appTheme.colors.foreground }}>
        {label}
      </Text>
      {detail ? <Text className="ml-4 flex-1 text-right text-sm" style={{ color: appTheme.colors.muted }}>{detail}</Text> : null}
    </Pressable>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="gap-px">
      <Text className="mb-2 px-1 text-xs font-bold uppercase tracking-wider" style={{ color: appTheme.colors.muted }}>{title}</Text>
      <View className="overflow-hidden rounded-2xl">{children}</View>
    </View>
  );

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-6 px-5 pb-12 pt-5"
      style={{ backgroundColor: appTheme.colors.background }}
    >
      <ProfileHeader
        avatarSource={props.avatarSource}
        initials={props.initials}
        isUpdatingPhoto={props.isUpdatingPhoto}
        onUpdatePhoto={props.onUpdatePhoto}
      />

      <Section title={t("profile.account")}>
        {props.isAuthenticated ? (
          <>
            <Row label={props.displayName} detail={props.email} onPress={props.onOpenAccount} />
            <Row label={props.syncActionLabel} detail={props.syncDetail} onPress={props.onSyncNow} />
            <Row label={t("common.signOut")} onPress={props.onSignOut} destructive />
          </>
        ) : <Row label={t("common.signIn")} onPress={props.onOpenAuth} />}
      </Section>

      <Section title={t("profile.appearance")}>
        <View className="min-h-14 flex-row items-center justify-between px-4" style={{ backgroundColor: rowColor }}>
          <Text className="font-semibold" style={{ color: appTheme.colors.foreground }}>{t("profile.darkMode")}</Text>
          <Switch
            value={appTheme.isDark}
            onValueChange={(value) => appTheme.setColorScheme(value ? "dark" : "light")}
            trackColor={{ true: appTheme.colors.primary }}
          />
        </View>
        <Row label="Font" onPress={props.onOpenFontSettings} />
      </Section>

      <Section title={t("profile.updates")}>
        <Row
          label={props.isCheckingForUpdate ? t("profile.checkingForUpdates") : t("profile.checkForUpdates")}
          detail={props.updateStatus}
          onPress={props.onCheckForUpdates}
        />
        <Row label={t("profile.appVersion", { version: APP_VERSION })} onPress={() => {}} />
      </Section>

      <Section title={t("profile.support")}>
        <Row label={t("profile.privacyPolicy")} onPress={props.onOpenPrivacyPolicy} />
        <Row label={t("profile.contactSupport")} onPress={props.onContactSupport} />
      </Section>

      {__DEV__ ? <Row label={t("profile.openOnboarding")} onPress={props.onOpenOnboarding} /> : null}
    </ScrollView>
  );
}
