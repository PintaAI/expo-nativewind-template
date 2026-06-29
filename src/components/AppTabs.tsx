import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useNativeTheme } from "./useNativeTheme";

export default function AppTabs() {
  const nativeTheme = useNativeTheme();

  return (
    <NativeTabs
      backgroundColor={nativeTheme.colors.background}
      tintColor={nativeTheme.colors.primary}
      iconColor={{ default: nativeTheme.colors.muted, selected: nativeTheme.colors.primary }}
      labelStyle={{ color: nativeTheme.colors.foreground }}
    >
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
