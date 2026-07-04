import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { AppText as RNText } from "@/components/AppText";
import { Stack } from "expo-router";
import SegmentedControl from "@expo/ui/community/segmented-control";
import { useAppTheme } from "@/components/AppTheme";
import { useDrawer } from "@/components/DrawerContext";
import { CashflowTable, type CashflowEntry, type IOType } from "@/components/cashflow/CashflowTable";
import { CashflowCalendar } from "@/components/cashflow/CashflowCalendar";
import { useCurrency } from "@/components/CurrencyProvider";
import { toDateKey } from "@/lib/date";

const MOCK_TEMPLATES: { name: string; category: string | null; io: IOType; nominal: number; createdBy: string | null }[] = [
  { name: "Monthly salary", category: "Gaji", io: "Income", nominal: 7250000, createdBy: "Nadia" },
  { name: "Product sprint invoice", category: "Freelance", io: "Income", nominal: 1850000, createdBy: "Raka" },
  { name: "Weekly groceries", category: "Belanja", io: "Expenses", nominal: 284000, createdBy: "Nadia" },
  { name: "MRT and ride share", category: "Transportasi", io: "Expenses", nominal: 76000, createdBy: "Raka" },
  { name: "Coffee with client", category: "Makanan", io: "Expenses", nominal: 118000, createdBy: "Dimas" },
  { name: "Electricity token", category: "Tagihan", io: "Expenses", nominal: 350000, createdBy: null },
  { name: "Design tools", category: "Lainnya", io: "Expenses", nominal: 225000, createdBy: "Nadia" },
];

function createMockEntries(dayCount = 90): CashflowEntry[] {
  const entries: CashflowEntry[] = [];
  const today = new Date();
  const entryCounts = [0, 1, 2, 0, 3, 1, 4, 2, 0, 1, 5, 2, 0, 1, 0, 3, 4, 1, 0, 2];

  for (let daysBack = dayCount - 1; daysBack >= 0; daysBack -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - daysBack);
    const dateKey = toDateKey(date);
    const dayIndex = dayCount - daysBack - 1;
    const count = entryCounts[dayIndex % entryCounts.length];

    for (let entryIndex = 0; entryIndex < count; entryIndex += 1) {
      const template = MOCK_TEMPLATES[(dayIndex + entryIndex) % MOCK_TEMPLATES.length];
      entries.push({
        id: `${dateKey}-${dayIndex}-${entryIndex}`,
        name: template.name,
        nominal: template.nominal,
        category: template.category,
        createdBy: template.createdBy,
        date: dateKey,
        io: template.io,
      });
    }
  }
  return entries;
}

export default function CashflowScreen() {
  const { open } = useDrawer();
  const appTheme = useAppTheme();
  const { format } = useCurrency();
  const [entries] = useState<CashflowEntry[]>(() => createMockEntries());
  const [view, setView] = useState<"list" | "calendar">("list");
  const positive = appTheme.colors.positive;
  const negative = appTheme.colors.negative;

  const monthlyTotals = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let income = 0;
    let expenses = 0;

    for (const entry of entries) {
      if (!entry.date?.startsWith(prefix)) continue;
      if (entry.io === "Income") income += entry.nominal;
      else expenses += entry.nominal;
    }

    return { income, expenses, net: income - expenses };
  }, [entries]);

  return (
    <>
      <Stack.Screen options={{ title: "Cashflow" }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="sidebar.left" onPress={open} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.View hidesSharedBackground>
          <SegmentedControl
            values={["List", "Kalender"]}
            selectedIndex={view === "list" ? 0 : 1}
            onChange={(event) => setView(event.nativeEvent.selectedSegmentIndex === 0 ? "list" : "calendar")}
            style={{ width: 180 }}
          />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <ScrollView
        className="bg-[--app-color-background] flex-1"
        contentContainerClassName="px-5 pb-10 pt-5"
        contentInsetAdjustmentBehavior="automatic"
      >
        {view === "list" ? (
          <View className="gap-4">
            <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
              <RNText className="text-xs" style={{ color: appTheme.colors.muted }}>
                <RNText style={{ color: appTheme.colors.muted }}>Net: </RNText>
                <RNText className="font-medium" style={{ color: appTheme.colors.foreground }}>
                  {format(monthlyTotals.net, { compact: true })}
                </RNText>
              </RNText>
              <RNText className="text-xs" style={{ color: appTheme.colors.muted }}>
                <RNText style={{ color: appTheme.colors.muted }}>Income: </RNText>
                <RNText className="font-medium" style={{ color: positive }}>
                  +{format(monthlyTotals.income, { compact: true })}
                </RNText>
              </RNText>
              <RNText className="text-xs" style={{ color: appTheme.colors.muted }}>
                <RNText style={{ color: appTheme.colors.muted }}>Expenses: </RNText>
                <RNText className="font-medium" style={{ color: negative }}>
                  -{format(monthlyTotals.expenses, { compact: true })}
                </RNText>
              </RNText>
            </View>
            <CashflowTable entries={entries} />
          </View>
        ) : (
          <CashflowCalendar entries={entries} />
        )}
      </ScrollView>
    </>
  );
}
