import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useAppTheme } from "./AppTheme";

export default function AppTabs() {
  const appTheme = useAppTheme();

  return (
    <NativeTabs
      backgroundColor={appTheme.colors.background}
      tintColor={appTheme.colors.primary}
      iconColor={{ default: appTheme.colors.muted, selected: appTheme.colors.primary }}
      labelStyle={{ color: appTheme.colors.foreground }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(cashflow)">
        <NativeTabs.Trigger.Label>Cashflow</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="dollarsign.circle.fill" md="attach_money" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
