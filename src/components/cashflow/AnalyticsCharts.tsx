import { useState, useMemo } from "react";
import type React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import Svg, { Circle, G } from "react-native-svg";
import { AppText as RNText } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";

import { alpha } from "@/lib/color";
import { toDateKey } from "@/lib/date";

// ─── Types ───────────────────────────────────────────────

type DatePeriod = { label: string; from?: string; to?: string; allTime?: boolean };

type Filters = {
  from?: string;
  to?: string;
  allTime?: boolean;
};

type CategoryAnalytics = { category: string; color?: string; total: number; count: number; percentage: number };
type MonthlyAnalytics = { month: string; monthLabel: string; income: number; expenses: number };
type CreatorAnalytics = { name: string | null; totalIncome: number; totalExpenses: number; entryCount: number };
type AnalyticsData = {
  summary: { totalIncome: number; totalExpenses: number; balance: number; entryCount: number };
  byCategory: CategoryAnalytics[];
  byMonth: MonthlyAnalytics[];
  byCreator: CreatorAnalytics[];
};

// ─── Helpers ──────────────────────────────────────────────

function ChartSymbol({ name, color, size = 14 }: { name: SFSymbol; color: string; size?: number }) {
  return <SymbolView name={name} size={size} tintColor={color} fallback={<RNText style={{ color }}>•</RNText>} />;
}

// ─── Mock Data ────────────────────────────────────────────

function createMockAnalytics(filters: Filters): AnalyticsData {
  const allMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(2026, 0 + i, 1);
    return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, monthLabel: d.toLocaleDateString("id-ID", { month: "short", year: "numeric" }) };
  });

  const allCategories: CategoryAnalytics[] = [
    { category: "Makanan", color: "#dc2626", total: 2840000, count: 42, percentage: 0 },
    { category: "Transportasi", color: "#ea580c", total: 1520000, count: 28, percentage: 0 },
    { category: "Belanja", color: "#ca8a04", total: 1960000, count: 19, percentage: 0 },
    { category: "Tagihan", color: "#2563eb", total: 2250000, count: 12, percentage: 0 },
    { category: "Hiburan", color: "#9333ea", total: 890000, count: 8, percentage: 0 },
    { category: "Lainnya", color: "#64748b", total: 440000, count: 5, percentage: 0 },
  ];
  const totalExpenses = allCategories.reduce((s, c) => s + c.total, 0);
  allCategories.forEach((c) => { c.percentage = Math.round((c.total / totalExpenses) * 100); });

  const totalIncome = 47500000;
  const entryCount = 160;

  const creators: CreatorAnalytics[] = [
    { name: "Nadia", totalIncome: 22000000, totalExpenses: 4200000, entryCount: 65 },
    { name: "Raka", totalIncome: 18500000, totalExpenses: 3100000, entryCount: 48 },
    { name: "Dimas", totalIncome: 7000000, totalExpenses: 1950000, entryCount: 30 },
    { name: null, totalIncome: 0, totalExpenses: 1250000, entryCount: 17 },
  ];

  return {
    summary: { totalIncome, totalExpenses: totalExpenses, balance: totalIncome - totalExpenses, entryCount },
    byCategory: allCategories,
    byMonth: allMonths.map((m, i) => ({
      ...m,
      income: totalIncome / 6 + Math.round((Math.sin(i * 1.2) * 1500000)),
      expenses: totalExpenses / 6 + Math.round((Math.cos(i * 1.5) * 400000)),
    })),
    byCreator: creators,
  };
}

// ─── Period Navigation ────────────────────────────────────

function PeriodNav({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  const appTheme = useAppTheme();
  return (
    <View className="flex-row items-center justify-between gap-2">
      <Pressable onPress={onPrev} className="h-9 w-9 items-center justify-center rounded-full">
        <ChartSymbol name="arrow.left" color={appTheme.colors.foreground} />
      </Pressable>
      <RNText className="flex-1 text-center text-sm font-semibold capitalize" style={{ color: appTheme.colors.foreground }}>
        {label}
      </RNText>
      <Pressable onPress={onNext} className="h-9 w-9 items-center justify-center rounded-full">
        <ChartSymbol name="arrow.right" color={appTheme.colors.foreground} />
      </Pressable>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const appTheme = useAppTheme();
  const bc = appTheme.isDark ? "rgba(255,255,255,0.13)" : "rgba(15,23,42,0.12)";
  return (
    <Pressable onPress={onPress} className="rounded-full px-3 py-1.5" style={{ backgroundColor: active ? appTheme.colors.primary : "transparent", borderColor: bc, borderWidth: 1 }}>
      <RNText className="text-xs font-semibold" style={{ color: active ? appTheme.colors.inverseForeground : appTheme.colors.muted }}>{label}</RNText>
    </Pressable>
  );
}

const DATE_PRESETS: DatePeriod[] = [
  { label: "All time", allTime: true },
  { label: "Today", from: toDateKey(new Date()), to: toDateKey(new Date()) },
  { label: "7 days", from: toDateKey(new Date(Date.now() - 6 * 86400000)), to: toDateKey(new Date()) },
  { label: "This month", from: toDateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), to: toDateKey(new Date()) },
  { label: "Last month", from: toDateKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)), to: toDateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 0)) },
  { label: "3 months", from: toDateKey(new Date(Date.now() - 90 * 86400000)), to: toDateKey(new Date()) },
  { label: "This year", from: toDateKey(new Date(new Date().getFullYear(), 0, 1)), to: toDateKey(new Date()) },
];

// ─── Monthly Trend Bar Chart ──────────────────────────────

function BarChart({ data }: { data: MonthlyAnalytics[] }) {
  const appTheme = useAppTheme();
  const { format } = useCurrency();
  const positive = appTheme.colors.positive;
  const negative = appTheme.colors.negative;
  const months = data.slice(-5);
  const maxVal = Math.max(...months.map((d) => d.income + d.expenses), 1);
  const height = (value: number) => Math.max(4, (value / maxVal) * 150);
  const bar = { width: 24 };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-end gap-4">
        {[["Income", positive], ["Expenses", negative]].map(([label, color]) => (
          <View key={label} className="flex-row items-center gap-1.5">
            <View className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
            <RNText className="text-xs" style={{ color: appTheme.colors.muted }}>{label}</RNText>
          </View>
        ))}
      </View>
      <View className="flex-row items-end" style={{ height: 220 }}>
        {months.map((d) => (
          <View key={d.month} className="flex-1 items-center gap-1.5">
            <RNText className="text-xs" style={{ color: appTheme.colors.muted }}>{format(d.income, { compact: true })}</RNText>
            <View style={{ ...bar, height: height(d.income), backgroundColor: positive, borderTopLeftRadius: 999, borderTopRightRadius: 999, borderBottomLeftRadius: 50, borderBottomRightRadius: 50 }} />
            <View style={{ ...bar, height: height(d.expenses), backgroundColor: negative, borderTopLeftRadius: 50, borderTopRightRadius: 50, borderBottomLeftRadius: 999, borderBottomRightRadius: 999 }} />
            <RNText className="text-xs" style={{ color: appTheme.colors.muted }}>{format(d.expenses, { compact: true })}</RNText>
            <View className="w-full items-center">
              <RNText numberOfLines={1} className="text-xs text-center" style={{ color: appTheme.colors.muted }}>{d.monthLabel}</RNText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Category Breakdown ───────────────────────────────────

function CategoryDonut({ data }: { data: CategoryAnalytics[] }) {
  const appTheme = useAppTheme();
  const { format } = useCurrency();
  const size = 176;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const segmentGap = 5;
  const trackColor = appTheme.isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)";
  const centerColor = appTheme.isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)";
  const total = data.reduce((sum, category) => sum + category.total, 0);
  let progress = 0;

  return (
    <View className="items-center gap-5">
      <View className="items-center justify-center" style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <G rotation="-90" origin={`${center}, ${center}`}>
            {data.map((category) => {
              const share = total > 0 ? category.total / total : 0;
              const dash = Math.max(0, share * circumference - segmentGap);
              const strokeDashoffset = -progress * circumference;
              progress += share;

              return (
                <Circle
                  key={category.category}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={category.color ?? appTheme.colors.primary}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  fill="transparent"
                />
              );
            })}
          </G>
        </Svg>
        <View className="absolute h-[104px] w-[104px] items-center justify-center rounded-full" style={{ backgroundColor: centerColor }}>
          <RNText className="text-xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>{format(total, { compact: true })}</RNText>
        </View>
      </View>

      <View className="w-full gap-2.5">
        {data.map((category) => (
          <View key={category.category} className="flex-row items-center gap-2.5">
            <View className="h-1.5 w-5 rounded-full" style={{ backgroundColor: category.color ?? appTheme.colors.primary }} />
            <RNText numberOfLines={1} className="flex-1 text-xs font-medium" style={{ color: appTheme.colors.foreground }}>{category.category}</RNText>
            <RNText className="w-10 text-right text-xs font-semibold" style={{ color: appTheme.colors.muted }}>{category.percentage}%</RNText>
            <RNText className="w-[72px] text-right text-xs font-semibold" style={{ color: appTheme.colors.foreground }}>{format(category.total, { compact: true })}</RNText>
          </View>
        ))}
      </View>
    </View>
  );
}

function CategoryBreakdown({ data }: { data: CategoryAnalytics[] }) {
  const appTheme = useAppTheme();
  const { format } = useCurrency();
  const [showDetail, setShowDetail] = useState(false);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <RNText className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>Category Breakdown</RNText>
        <Pressable onPress={() => setShowDetail(!showDetail)} className="rounded-full px-2.5 py-1" style={{ backgroundColor: appTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)" }}>
          <RNText className="text-xs font-medium" style={{ color: appTheme.colors.muted }}>{showDetail ? "Chart" : "Details"}</RNText>
        </Pressable>
      </View>

      {!showDetail ? (
        <CategoryDonut data={data} />
      ) : (
        <View className="overflow-hidden rounded-2xl" style={{ borderColor: appTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)", borderWidth: 1 }}>
          <View className="flex-row items-center border-b px-4 py-2.5" style={{ backgroundColor: appTheme.isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.02)", borderBottomColor: appTheme.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)" }}>
            <RNText className="flex-1 text-xs font-semibold" style={{ color: appTheme.colors.muted }}>Category</RNText>
            <RNText className="w-[90px] text-right text-xs font-semibold" style={{ color: appTheme.colors.muted }}>Total</RNText>
            <RNText className="w-[55px] text-right text-xs font-semibold" style={{ color: appTheme.colors.muted }}>Count</RNText>
            <RNText className="w-[50px] text-right text-xs font-semibold" style={{ color: appTheme.colors.muted }}>%</RNText>
          </View>
          {data.map((cat, i) => (
            <View key={cat.category} className="flex-row items-center border-b px-4 py-2.5" style={{ borderBottomColor: appTheme.isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)", backgroundColor: i === 0 ? alpha(cat.color ?? appTheme.colors.primary, 0.06) : "transparent" }}>
              <View className="flex-1 flex-row items-center gap-2">
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <RNText numberOfLines={1} className="text-xs font-medium" style={{ color: appTheme.colors.foreground }}>{cat.category}</RNText>
              </View>
              <RNText className="w-[90px] text-right text-xs font-semibold" style={{ color: appTheme.colors.foreground }}>{format(cat.total, { compact: true })}</RNText>
              <RNText className="w-[55px] text-right text-xs" style={{ color: appTheme.colors.muted }}>{cat.count}</RNText>
              <RNText className="w-[50px] text-right text-xs" style={{ color: appTheme.colors.muted }}>{cat.percentage}%</RNText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Creator Breakdown ────────────────────────────────────

function CreatorBreakdown({ data }: { data: CreatorAnalytics[] }) {
  const appTheme = useAppTheme();
  const { format } = useCurrency();
  const positive = appTheme.colors.positive;
  const negative = appTheme.colors.negative;
  const maxExpense = Math.max(...data.map((c) => c.totalExpenses), 1);

  return (
    <View className="gap-3">
      {data.map((creator) => {
        const label = creator.name ?? "Unknown";
        const initials = label.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

        return (
          <View key={creator.name ?? "unknown"} className="gap-2">
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: alpha(appTheme.colors.primary, 0.13) }}>
                <RNText className="text-xs font-bold" style={{ color: appTheme.colors.primary }}>{initials}</RNText>
              </View>
              <View className="min-w-0 flex-1">
                <RNText numberOfLines={1} className="text-sm font-medium" style={{ color: appTheme.colors.foreground }}>{label}</RNText>
                <RNText className="text-xs" style={{ color: appTheme.colors.muted }}>{creator.entryCount} entries</RNText>
              </View>
              <View className="items-end shrink-0">
                {creator.totalIncome > 0 ? (
                  <RNText className="text-xs font-semibold" style={{ color: positive }}>+{format(creator.totalIncome, { compact: true })}</RNText>
                ) : null}
                {creator.totalExpenses > 0 ? (
                  <RNText className="text-xs font-semibold" style={{ color: negative }}>-{format(creator.totalExpenses, { compact: true })}</RNText>
                ) : null}
              </View>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: appTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.07)" }}>
              <View className="h-full rounded-full" style={{ width: `${(creator.totalExpenses / maxExpense) * 100}%`, backgroundColor: negative, opacity: 0.6 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────

export function AnalyticsCharts({ header, hideStats = false }: { header?: React.ReactNode; hideStats?: boolean }) {
  const appTheme = useAppTheme();
  const { format } = useCurrency();
  const positive = appTheme.colors.positive;
  const negative = appTheme.colors.negative;
  const [showBalance, setShowBalance] = useState(true);
  const [datePeriod, setDatePeriod] = useState<DatePeriod>(DATE_PRESETS[0]);
  const [monthOffset, setMonthOffset] = useState(0);

  const data = useMemo(() => createMockAnalytics({ from: datePeriod.from, to: datePeriod.to, allTime: datePeriod.allTime }), [datePeriod]);

  const monthDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = monthDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const mutedSurface = appTheme.isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)";
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)";

  return (
    <ScrollView
      className="bg-[--app-color-background] flex-1"
      contentContainerClassName="gap-4 px-5 pb-10 pt-5"
      contentInsetAdjustmentBehavior="automatic"
    >
      {header}

      {/* Stats */}
      {hideStats ? null : (
        <View className="mb-1">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-3">
              <RNText className="text-xs font-semibold uppercase tracking-[2px]" style={{ color: appTheme.colors.muted }}>Balance</RNText>
              <Pressable onPress={() => setShowBalance(!showBalance)} className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: mutedSurface }}>
                <ChartSymbol name={showBalance ? "eye.fill" : "eye.slash.fill"} color={appTheme.colors.muted} />
              </Pressable>
            </View>
            <View className="flex-row items-center gap-2">
              <ChartSymbol name="arrow.down.circle.fill" color={positive} />
              <RNText className="text-xs font-semibold" style={{ color: positive }}>{showBalance ? format(data.summary.totalIncome, { compact: true }) : "••••"}</RNText>
              <View className="h-3 w-px" style={{ backgroundColor: appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)" }} />
              <ChartSymbol name="arrow.up.circle.fill" color={negative} />
              <RNText className="text-xs font-semibold" style={{ color: negative }}>{showBalance ? format(data.summary.totalExpenses, { compact: true }) : "••••"}</RNText>
            </View>
          </View>
          <RNText className="mt-1 text-4xl font-black tracking-tight" style={{ color: data.summary.balance < 0 ? negative : appTheme.colors.foreground }}>
            {showBalance ? format(data.summary.balance, { compact: true }) : "••••••"}
          </RNText>
          <RNText className="mt-0.5 text-xs" style={{ color: appTheme.colors.muted }}>{data.summary.entryCount} entries</RNText>
        </View>
      )}

      {/* Period Navigation */}
      <PeriodNav label={monthLabel} onPrev={() => setMonthOffset((o) => o - 1)} onNext={() => setMonthOffset((o) => o + 1)} />

      {/* Filter Presets */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {DATE_PRESETS.map((preset) => {
          const isActive = preset.label === datePeriod.label || (preset.allTime && datePeriod.allTime) || (preset.from === datePeriod.from && preset.to === datePeriod.to);
          return <FilterChip key={preset.label} label={preset.label} active={isActive} onPress={() => setDatePeriod(preset)} />;
        })}
      </ScrollView>

      {/* Monthly Trend */}
      <View className="overflow-hidden rounded-2xl p-4" style={{ borderColor, borderWidth: 1 }}>
        <RNText className="mb-3 text-sm font-bold" style={{ color: appTheme.colors.foreground }}>Monthly Trend</RNText>
        <BarChart data={data.byMonth} />
      </View>

      {/* Category Breakdown */}
      <View className="overflow-hidden rounded-2xl p-4" style={{ borderColor, borderWidth: 1 }}>
        <CategoryBreakdown data={data.byCategory} />
      </View>

      {/* Creator Breakdown */}
      <View className="overflow-hidden rounded-2xl p-4" style={{ borderColor, borderWidth: 1 }}>
        <RNText className="mb-3 text-sm font-bold" style={{ color: appTheme.colors.foreground }}>By Member</RNText>
        <CreatorBreakdown data={data.byCreator} />
      </View>
    </ScrollView>
  );
}
