import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { AppText as RNText } from "@/components/AppText";
import { router, Stack, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { GlassView } from "expo-glass-effect";

import { useDrawer } from "@/components/DrawerContext";
import { useAppTheme } from "@/components/AppTheme";
import { alpha } from "@/lib/color";
import { ActivityHeatmap, type ActivityOverview } from "@/components/cashflow/ActivityHeatmap";
import { CashflowTable, type CashflowEntry, type IOType } from "@/components/cashflow/CashflowTable";
import { CashflowStatsCard, mockCashflowStats } from "@/components/cashflow/CashflowStatsCard";
import { toDateKey } from "@/lib/date";

function createMockActivityOverview(daysBack = 182): ActivityOverview {
  const today = new Date();
  const trailingCounts = [2, 1, 4, 2, 3, 1];
  const days = Array.from({ length: daysBack }, (_, index) => {
    const date = new Date(today);
    const daysUntilToday = daysBack - index - 1;
    date.setDate(today.getDate() - daysUntilToday);

    let count = 0;
    if (daysUntilToday < trailingCounts.length) {
      count = trailingCounts[trailingCounts.length - daysUntilToday - 1];
    } else if (index % 29 === 0) {
      count = 6;
    } else if (index % 17 === 0) {
      count = 4;
    } else if (index % 11 === 0) {
      count = 3;
    } else if (index % 7 === 0) {
      count = 2;
    } else if (index % 5 === 0) {
      count = 1;
    }

    return { date: toDateKey(date), count };
  });
  const totalEntries = days.reduce((total, day) => total + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  let currentStreak = 0;

  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].count === 0) break;
    currentStreak += 1;
  }

  return { days, totalEntries, activeDays, currentStreak };
}

const activity = createMockActivityOverview();

const mockEntryTemplates: { name: string; category: string | null; io: IOType; nominal: number; createdBy: string | null }[] = [
  { name: "Monthly salary", category: "Salary", io: "Income", nominal: 7250000, createdBy: "Nadia" },
  { name: "Product sprint invoice", category: "Freelance", io: "Income", nominal: 1850000, createdBy: "Raka" },
  { name: "Weekly groceries", category: "Groceries", io: "Expenses", nominal: 284000, createdBy: "Nadia" },
  { name: "MRT and ride share", category: "Transport", io: "Expenses", nominal: 76000, createdBy: "Raka" },
  { name: "Coffee with client", category: "Coffee & meals", io: "Expenses", nominal: 118000, createdBy: "Dimas" },
  { name: "Electricity token", category: "Utilities", io: "Expenses", nominal: 350000, createdBy: null },
  { name: "Design tools", category: "Subscriptions", io: "Expenses", nominal: 225000, createdBy: "Nadia" },
];

function createMockEntries(activityOverview: ActivityOverview): CashflowEntry[] {
  return activityOverview.days.flatMap((day, dayIndex) => {
    return Array.from({ length: day.count }, (_, entryIndex) => {
      const template = mockEntryTemplates[(dayIndex + entryIndex) % mockEntryTemplates.length];
      const isIncome = template.io === "Income";
      const multiplier = 1 + ((dayIndex + entryIndex) % 4) * 0.08;

      return {
        id: `${day.date}-${entryIndex}`,
        name: template.name,
        nominal: Math.round(template.nominal * multiplier),
        category: template.category,
        createdBy: template.createdBy,
        date: day.date,
        io: isIncome ? "Income" : "Expenses",
      };
    });
  });
}

const entries = createMockEntries(activity);

export default function HomeScreen() {
  const { open } = useDrawer();
  const appTheme = useAppTheme();
  const [selectedDate, setSelectedDate] = useState(activity.days.at(-1)?.date ?? toDateKey(new Date()));

  const dayEntries = useMemo(
    () => entries.filter((e) => e.date === selectedDate),
    [selectedDate],
  );

  return (
    <>
      <Stack.Screen options={{ title: "Home" }} />

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
              accessibilityLabel="Catat"
              className="flex-row items-center gap-1.5 px-6 py-3"
              onPress={() => router.push("/forms/entry-form" as Href)}
            >
              <SymbolView name="plus" size={16} tintColor={appTheme.colors.background} fallback={<RNText className="text-base" style={{ color: appTheme.colors.background }}>+</RNText>} />
              <RNText className="font-bold text-base" style={{ color: appTheme.colors.background }}>
                Catat
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
        <CashflowStatsCard stats={mockCashflowStats} />
        <ActivityHeatmap activity={activity} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        <View className="mt-5">
          <CashflowTable entries={dayEntries} dateFilter={selectedDate} onDateFilterChange={setSelectedDate} hideTanggal />
        </View>
      </ScrollView>
    </>
  );
}
