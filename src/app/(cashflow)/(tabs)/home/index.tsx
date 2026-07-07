import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText as RNText } from "@/components/AppText";
import { router, Stack, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { GlassView } from "expo-glass-effect";
import { useTranslation } from "react-i18next";

import { useDrawer } from "@/components/DrawerContext";
import { useAppTheme } from "@/components/AppTheme";
import { alpha } from "@/lib/color";
import { ActivityHeatmap } from "@/components/cashflow/ActivityHeatmap";
import { CashflowTable } from "@/components/cashflow/CashflowTable";
import { CashflowStatsCard } from "@/components/cashflow/CashflowStatsCard";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import { toDateKey } from "@/lib/date";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { open } = useDrawer();
  const appTheme = useAppTheme();
  const { activity, entries, stats, activeManagement } = useCashflowData();
  const latestDate = activity.days.at(-1)?.date ?? toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(latestDate);
  const effectiveSelectedDate = activity.days.some((day) => day.date === selectedDate) ? selectedDate : latestDate;

  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === effectiveSelectedDate),
    [effectiveSelectedDate, entries],
  );

  return (
    <>
      <Stack.Screen options={{ title: t('tabs.home') }} />

      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="sidebar.left"
          onPress={open}
        />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.View hidesSharedBackground>
            <GlassView
              isInteractive
              tintColor={alpha(appTheme.colors.primary, appTheme.isDark ? 1 : 0.72)}
              glassEffectStyle="clear"
              style={{ borderRadius: 9999 }}
            >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('entry.catat')}
              className="flex-row items-center gap-1.5 px-6 py-3"
              onPress={() => router.push("/forms/entry-form" as Href)}
            >
              <SymbolView name="plus" size={16} tintColor={appTheme.colors.background} fallback={<RNText className="text-base" style={{ color: appTheme.colors.background }}>+</RNText>} />
              <RNText className="font-bold text-base" style={{ color: appTheme.colors.background }}>
                {t('entry.catat')}
              </RNText>
            </Pressable>
          </GlassView>
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <ScrollView
        className="bg-[--app-color-background] flex-1"
        contentContainerClassName="px-5 pb-10 pt-5"
        contentInsetAdjustmentBehavior="automatic"
      >
        <CashflowStatsCard stats={stats} managementName={activeManagement?.name} />
        <ActivityHeatmap activity={activity} selectedDate={effectiveSelectedDate} onDateSelect={setSelectedDate} />
        <View className="mt-5">
          <CashflowTable entries={dayEntries} dateFilter={effectiveSelectedDate} onDateFilterChange={setSelectedDate} hideTanggal />
        </View>
      </ScrollView>
    </>
  );
}
