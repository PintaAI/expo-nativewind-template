import { Platform, Pressable, ScrollView, View } from "react-native";
import { router, Stack } from "expo-router";
import { toolbarIcons } from "@/config/toolbarIcons";
import { useTranslation } from "react-i18next";
import { AppText as Text } from "@/components/AppText";
import { AndroidFormFooter, AndroidFormFooterButton } from "@/components/AndroidFormFooter";
import type { SFSymbol } from "expo-symbols";
import { AppSymbol } from "@/components/AppSymbol";
import { useAppTheme } from "@/components/AppTheme";
import { alpha } from "@/lib/color";

type SidebarFormSheetProps = {
  title: string;
  description: string;
  icon: SFSymbol;
  fields: string[];
  actions?: string[];
  androidFitToContents?: boolean;
};

function PlaceholderField({ label }: { label: string }) {
  const appTheme = useAppTheme();
  const { t } = useTranslation();
  const fieldBackground = appTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.045)";
  const fieldBorder = appTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)";

  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold" style={{ color: appTheme.colors.foreground }}>
        {label}
      </Text>
      <View
        className="h-12 rounded-2xl border px-4"
        style={{ backgroundColor: fieldBackground, borderColor: fieldBorder, justifyContent: "center" }}
      >
        <Text style={{ color: appTheme.colors.muted }}>{t("sidebarForm.placeholder")}</Text>
      </View>
    </View>
  );
}

export function SidebarFormSheet({ title, description, icon, fields, actions: actionsProp, androidFitToContents = false }: SidebarFormSheetProps) {
  const appTheme = useAppTheme();
  const { t } = useTranslation();
  const actions = actionsProp ?? [t("common.cancel"), t("common.save")];
  const accentSurface = alpha(appTheme.colors.primary, appTheme.isDark ? 0.18 : 0.12);
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)";

  return (
    <>
      <Stack.Screen
        options={{
          title,
          unstable_sheetFooter: Platform.OS === "android"
            ? () => (
                <AndroidFormFooter>
                  <AndroidFormFooterButton label={t("common.close")} onPress={() => router.back()} />
                </AndroidFormFooter>
              )
            : undefined,
        }}
      />
      {Platform.OS === "ios" ? (
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button icon={toolbarIcons.close} accessibilityLabel="Close" onPress={() => router.back()} />
        </Stack.Toolbar>
      ) : null}
      <ScrollView
        className={Platform.OS === "android" && androidFitToContents ? "bg-[--app-color-background]" : "flex-1 bg-[--app-color-background]"}
        contentContainerClassName="gap-5 px-5 pb-8 pt-6"
        contentInsetAdjustmentBehavior="automatic"
        nestedScrollEnabled={Platform.OS === "android"}
      >
        <View className="gap-3 rounded-3xl border p-4" style={{ borderColor, backgroundColor: accentSurface }}>
          <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: appTheme.colors.primary }}>
            <AppSymbol name={icon} size={22} tintColor={appTheme.colors.inverseForeground} fallback={<Text>•</Text>} />
          </View>
          <View className="gap-1">
            <Text className="text-2xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
              {title}
            </Text>
            <Text className="text-base leading-6" style={{ color: appTheme.colors.muted }}>
              {description}
            </Text>
          </View>
        </View>

        <View className="gap-4">
          {fields.map((field) => (
            <PlaceholderField key={field} label={field} />
          ))}
        </View>

        <View className="flex-row gap-2 pt-1">
          {actions.map((action, index) => {
            const isPrimary = index === actions.length - 1;

            return (
              <Pressable
                key={action}
                accessibilityRole="button"
                className="h-12 flex-1 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor: isPrimary ? appTheme.colors.primary : "transparent",
                  borderColor: isPrimary ? appTheme.colors.primary : borderColor,
                }}
                onPress={isPrimary ? undefined : () => router.back()}
              >
                <Text
                  className="font-bold"
                  style={{ color: isPrimary ? appTheme.colors.inverseForeground : appTheme.colors.foreground }}
                >
                  {action}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}
