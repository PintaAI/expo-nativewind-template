import { router, Stack } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toolbarIcons } from "@/config/toolbarIcons";
import { useDrawer } from "@/components/DrawerContext";
import { AnalyticsCharts, DATE_PRESETS, type DatePeriod } from "@/components/cashflow/AnalyticsCharts";
import { CashflowStatsCard } from "@/components/cashflow/CashflowStatsCard";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import { buildAnalytics, buildStats } from "@/data/cashflow/repository";

export default function SummaryScreen() {
  const { t } = useTranslation();
  const { open } = useDrawer();
  const { analytics, entries, categories, activeManagement } = useCashflowData();
  const [datePeriod, setDatePeriod] = useState<DatePeriod>(DATE_PRESETS[0]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  const filteredEntries = useMemo(() => {
    if (datePeriod.allTime) return entries;
    return entries.filter((entry) => {
      if (datePeriod.from && entry.date < datePeriod.from) return false;
      if (datePeriod.to && entry.date > datePeriod.to) return false;
      return true;
    });
  }, [datePeriod, entries]);

  const filteredAnalytics = useMemo(() => buildAnalytics(filteredEntries, categories), [categories, filteredEntries]);
  const filteredStats = useMemo(() => buildStats(filteredEntries), [filteredEntries]);

  return (
    <>
      <Stack.Screen options={{ title: t('tabs.summary') }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon={toolbarIcons.menu}
          accessibilityLabel="Open menu"
          onPress={open}
        />
      </Stack.Toolbar>
      <AnalyticsCharts
        data={filteredAnalytics}
        monthlyTrendData={analytics.byMonth}
        datePeriod={datePeriod}
        onDatePeriodChange={setDatePeriod}
        selectedMonth={selectedMonth}
        onSelectedMonthChange={setSelectedMonth}
        onCategoryPress={(category) => router.push({
          pathname: "/forms/category-entries",
          params: { category, from: datePeriod.from ?? "", to: datePeriod.to ?? "" },
        })}
        header={<CashflowStatsCard stats={filteredStats} hideMoreButton managementName={activeManagement?.name} />}
        hideStats
      />
    </>
  );
}
