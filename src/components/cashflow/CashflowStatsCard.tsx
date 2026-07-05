import { useState } from "react";
import { Pressable, View } from "react-native";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { router } from "expo-router";

import { AppText as RNText } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { alpha } from "@/lib/color";

export type CashflowStats = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  currentWeek: {
    weekNumber: number;
    range: string;
    income: number;
    expenses: number;
  };
  currentMonth: {
    label: string;
    income: number;
    expenses: number;
  };
  topExpenseCategories: {
    category: string;
    total: number;
    percentage: number;
  }[];
};

export const mockCashflowStats: CashflowStats = {
  totalIncome: 12850000,
  totalExpenses: 7420000,
  balance: 5430000,
  currentWeek: {
    weekNumber: 27,
    range: "30 Jun - 6 Jul",
    income: 2750000,
    expenses: 1385000,
  },
  currentMonth: {
    label: "June 2026",
    income: 12850000,
    expenses: 7420000,
  },
  topExpenseCategories: [
    { category: "Groceries", total: 1850000, percentage: 72 },
    { category: "Transport", total: 960000, percentage: 38 },
    { category: "Coffee & meals", total: 680000, percentage: 26 },
  ],
};

function StatSymbol({ name, color }: { name: SFSymbol; color: string }) {
  return (
    <SymbolView
      name={name}
      size={15}
      tintColor={color}
      fallback={<RNText style={{ color }}>•</RNText>}
    />
  );
}

export function CashflowStatsCard({ stats, hideMoreButton = false, managementName }: { stats: CashflowStats; hideMoreButton?: boolean; managementName?: string }) {
  const appTheme = useAppTheme();
  const { format } = useCurrency();
  const [showBalance, setShowBalance] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const positive = appTheme.colors.positive;
  const negative = appTheme.colors.negative;
  const detailBackground = appTheme.isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)";
  const mutedLine = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
  const balanceText = showBalance ? format(stats.balance, { compact: true }) : "••••••";

  return (
    <View className="mb-5">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.push("/forms/wallet")}
            accessibilityRole="button"
            accessibilityLabel="Switch wallet"
            className="max-w-[170px] flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5"
            style={{ backgroundColor: detailBackground }}
          >
            <RNText
              numberOfLines={1}
              className="shrink text-xs font-semibold uppercase tracking-[2px]"
              style={{ color: appTheme.colors.muted }}
            >
              {managementName ?? "Balance"}
            </RNText>
            <StatSymbol name="chevron.down" color={appTheme.colors.muted} />
          </Pressable>
          <Pressable
            onPress={() => setShowBalance(!showBalance)}
            accessibilityRole="button"
            accessibilityLabel={showBalance ? "Hide balance" : "Show balance"}
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: detailBackground }}
          >
            <StatSymbol name={showBalance ? "eye.fill" : "eye.slash.fill"} color={appTheme.colors.muted} />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2">
          <StatSymbol name="arrow.down.circle.fill" color={positive} />
          <RNText className="text-xs font-semibold" style={{ color: positive }}>
            {showBalance ? format(stats.totalIncome, { compact: true }) : "••••"}
          </RNText>
          <View className="h-3 w-px" style={{ backgroundColor: mutedLine }} />
          <StatSymbol name="arrow.up.circle.fill" color={negative} />
          <RNText className="text-xs font-semibold" style={{ color: negative }}>
            {showBalance ? format(stats.totalExpenses, { compact: true }) : "••••"}
          </RNText>
        </View>
      </View>

      <View className="flex-row items-end justify-between gap-4">
        <View className="min-w-0 flex-1">
          <RNText
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-4xl font-black tracking-tight"
            style={{ color: stats.balance < 0 ? negative : appTheme.colors.foreground }}
          >
            {balanceText}
          </RNText>

        </View>

        {hideMoreButton ? null : (
          <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? "Hide more stats" : "Show more stats"}
            className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5"
            style={{
              backgroundColor: isExpanded ? alpha(appTheme.colors.primary, 0.1) : "transparent",
            }}
          >
            <RNText
              className="text-xs font-semibold"
              style={{ color: isExpanded ? appTheme.colors.primary : appTheme.colors.foreground }}
            >
              {isExpanded ? "Hide" : "More"}
            </RNText>
            <StatSymbol
              name={isExpanded ? "chevron.up" : "chevron.down"}
              color={isExpanded ? appTheme.colors.primary : appTheme.colors.foreground}
            />
          </Pressable>
        )}
      </View>

      {!hideMoreButton && isExpanded ? (
        <View className="mt-5 gap-3">
          <View className="gap-3 py-2">
            <View className="flex-row items-center gap-2">
              <StatSymbol name="calendar" color={appTheme.colors.muted} />
              <RNText className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>
                {stats.currentMonth.label}
              </RNText>
            </View>
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-2">
              <StatSymbol name="arrow.down.circle.fill" color={positive} />
              <RNText className="text-sm font-bold" style={{ color: positive }}>
                {showBalance ? format(stats.currentMonth.income, { compact: true }) : "••••"}
              </RNText>
              <View className="h-3 w-px" style={{ backgroundColor: mutedLine }} />
              <StatSymbol name="arrow.up.circle.fill" color={negative} />
              <RNText className="text-sm font-bold" style={{ color: negative }}>
                {showBalance ? format(stats.currentMonth.expenses, { compact: true }) : "••••"}
              </RNText>
              <View className="h-3 w-px" style={{ backgroundColor: mutedLine }} />
              <RNText className="text-xs" style={{ color: appTheme.colors.muted }}>
                Net
              </RNText>
              <RNText className="text-sm font-black" style={{ color: appTheme.colors.foreground }}>
                {showBalance
                  ? format(stats.currentMonth.income - stats.currentMonth.expenses, { compact: true })
                  : "••••"}
              </RNText>
            </View>
          </View>

          <View className="h-px" style={{ backgroundColor: mutedLine }} />

          <View className="gap-3 py-2">
            <View className="flex-row items-center gap-2">
              <StatSymbol name="calendar.badge.plus" color={appTheme.colors.muted} />
              <RNText className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>
                Current Week
              </RNText>
            </View>
            <RNText className="text-xs" style={{ color: appTheme.colors.muted }}>
              Week {stats.currentWeek.weekNumber} • {stats.currentWeek.range}
            </RNText>
            <View className="flex-row items-center gap-2">
              <StatSymbol name="arrow.down.circle.fill" color={positive} />
              <RNText className="text-sm font-bold" style={{ color: positive }}>
                {showBalance ? format(stats.currentWeek.income, { compact: true }) : "••••"}
              </RNText>
              <View className="h-3 w-px" style={{ backgroundColor: mutedLine }} />
              <StatSymbol name="arrow.up.circle.fill" color={negative} />
              <RNText className="text-sm font-bold" style={{ color: negative }}>
                {showBalance ? format(stats.currentWeek.expenses, { compact: true }) : "••••"}
              </RNText>
              <View className="h-3 w-px" style={{ backgroundColor: mutedLine }} />
              <RNText className="text-xs" style={{ color: appTheme.colors.muted }}>
                Net
              </RNText>
              <RNText className="text-sm font-black" style={{ color: appTheme.colors.foreground }}>
                {showBalance
                  ? format(stats.currentWeek.income - stats.currentWeek.expenses, { compact: true })
                  : "••••"}
              </RNText>
            </View>
          </View>

          <View className="gap-3 py-2">
            <View className="flex-row items-center gap-2">
              <StatSymbol name="bag.fill" color={appTheme.colors.muted} />
              <RNText className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>
                Top Expenses
              </RNText>
            </View>
            {stats.topExpenseCategories.map((category, index) => (
              <View key={category.category} className="gap-1.5">
                <View className="flex-row items-center justify-between gap-3">
                  <RNText numberOfLines={1} className="flex-1 text-xs" style={{ color: appTheme.colors.muted }}>
                    {index + 1}. {category.category}
                  </RNText>
                  <RNText className="text-xs font-bold" style={{ color: appTheme.colors.foreground }}>
                    {showBalance ? format(category.total, { compact: true }) : "••••"}
                  </RNText>
                </View>
                <View className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: mutedLine }}>
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(category.percentage, 100)}%`, backgroundColor: negative, opacity: 0.72 }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
