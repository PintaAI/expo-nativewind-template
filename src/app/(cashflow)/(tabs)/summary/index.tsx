import { Stack } from "expo-router";
import { useDrawer } from "@/components/DrawerContext";
import { AnalyticsCharts } from "@/components/cashflow/AnalyticsCharts";
import { CashflowStatsCard, mockCashflowStats } from "@/components/cashflow/CashflowStatsCard";

export default function SummaryScreen() {
  const { open } = useDrawer();

  return (
    <>
      <Stack.Screen options={{ title: "Summary" }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="sidebar.left"
          onPress={open}
        />
      </Stack.Toolbar>
      <AnalyticsCharts header={<CashflowStatsCard stats={mockCashflowStats} hideMoreButton />} hideStats />
    </>
  );
}
