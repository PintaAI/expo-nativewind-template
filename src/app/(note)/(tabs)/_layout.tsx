import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useAppTheme } from "@/components/AppTheme";

export default function NoteTabsLayout() {
  const appTheme = useAppTheme();

  return (
    <NativeTabs
      backgroundColor={appTheme.colors.background}
      tintColor={appTheme.colors.primary}
      iconColor={{ default: appTheme.colors.muted, selected: appTheme.colors.primary }}
      labelStyle={{ color: appTheme.colors.foreground }}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notes">
        <NativeTabs.Trigger.Label>Notes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="note.text" md="notes" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="summary">
        <NativeTabs.Trigger.Label>Summary</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "chart.pie", selected: "chart.pie.fill" }} md="pie_chart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
