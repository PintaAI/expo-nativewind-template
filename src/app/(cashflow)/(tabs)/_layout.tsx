import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useAppTheme } from "@/components/AppTheme";
import { useTranslation } from "react-i18next";

export default function CashflowTabsLayout() {
  const { t } = useTranslation();
  const appTheme = useAppTheme();

  return (
    <NativeTabs
      backgroundColor={appTheme.colors.background}
      tintColor={appTheme.colors.primary}
      iconColor={{ default: appTheme.colors.muted, selected: appTheme.colors.primary }}
      labelStyle={{ color: appTheme.colors.foreground }}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cashflow">
        <NativeTabs.Trigger.Label>{t('tabs.cashflow')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="arrow.up.left.arrow.down.right.circle" md="swap_vert" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="summary">
        <NativeTabs.Trigger.Label>{t('tabs.summary')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "chart.pie", selected: "chart.pie.fill" }} md="pie_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
