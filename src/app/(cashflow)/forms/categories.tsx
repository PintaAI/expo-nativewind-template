import { useState } from "react";
import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { router, Stack } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import type { BudgetPeriod, CashflowCategory } from "@/data/cashflow/types";
import { alpha } from "@/lib/color";

const COLOR_OPTIONS = ["#16a34a", "#2563eb", "#ca8a04", "#dc2626", "#7c3aed", "#0891b2"] as const;
const ICON_OPTIONS = ["tag.fill", "fork.knife", "car.fill", "basket.fill", "banknote.fill", "bolt.fill"] as const satisfies readonly SFSymbol[];
const BUDGET_PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
] as const satisfies readonly { key: BudgetPeriod; label: string }[];

function formatBudgetInput(value: number | null) {
  return value ? String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
}

function parseBudgetInput(value: string) {
  const parsed = parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function BudgetField({ label, value, onSave }: { label: string; value: number | null; onSave: (value: number | null) => Promise<void> }) {
  const appTheme = useAppTheme();
  const { format } = useCurrency();
  const [draft, setDraft] = useState(formatBudgetInput(value));
  const parsedDraft = parseBudgetInput(draft);
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";

  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase tracking-[1.4px]" style={{ color: appTheme.colors.muted }}>
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={draft ? `Rp ${draft}` : ""}
          onChangeText={(text) => setDraft(formatBudgetInput(parseBudgetInput(text)))}
          placeholder="Rp 0"
          placeholderTextColor={appTheme.colors.muted}
          keyboardType="number-pad"
          selectionColor={appTheme.colors.primary}
          className="min-h-11 flex-1 rounded-2xl px-3 text-sm"
          style={{ color: appTheme.colors.foreground, backgroundColor: appTheme.colors.background, borderColor, borderWidth: 1 }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => onSave(parsedDraft)}
          className="min-h-11 items-center justify-center rounded-2xl px-3"
          style={{ backgroundColor: appTheme.colors.primary }}
        >
          <Text className="text-xs font-bold" style={{ color: appTheme.colors.inverseForeground }}>
            Save
          </Text>
        </Pressable>
      </View>
      {value ? (
        <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
          Current: {format(value, { compact: true })}
        </Text>
      ) : null}
    </View>
  );
}

function categoryBudgetValue(category: CashflowCategory, period: BudgetPeriod) {
  if (period === "daily") return category.budgetDaily;
  if (period === "weekly") return category.budgetWeekly;
  return category.budgetMonthly;
}

export default function CategoriesFormSheet() {
  const appTheme = useAppTheme();
  const { activeManagement, categories, overallBudgets, createCategory, deleteCategory, updateOverallBudget, updateCategoryBudget } = useCashflowData();
  const [name, setName] = useState("");
  const [color, setColor] = useState<(typeof COLOR_OPTIONS)[number]>(COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState<SFSymbol>(ICON_OPTIONS[0]);
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
  const surface = appTheme.isDark ? "rgba(255,255,255,0.055)" : "rgba(15,23,42,0.035)";

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    await createCategory({ name: trimmed, color, icon });
    setName("");
  };

  const confirmDelete = (id: string, categoryName: string) => {
    Alert.alert("Remove category?", `Entries using ${categoryName} will stay saved, but the category will be hidden from new entries.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteCategory(id) },
    ]);
  };

  const overallBudgetByPeriod = new Map(overallBudgets.map((budget) => [budget.period, budget.nominal]));

  return (
    <>
      <Stack.Screen options={{ title: "Categories & Budget" }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" onPress={() => router.back()} />
      </Stack.Toolbar>
      <ScrollView
        className="flex-1 bg-[--app-color-background]"
        contentContainerClassName="gap-5 px-5 pb-10 pt-5"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-[2px]" style={{ color: appTheme.colors.muted }}>
            {activeManagement?.name ?? "Wallet"}
          </Text>
          <Text className="text-3xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
            Categories & Budget
          </Text>
          <Text className="text-sm leading-5" style={{ color: appTheme.colors.muted }}>
            Manage labels and budget limits in one place while keeping wallet and category budgets separate.
          </Text>
        </View>

        <View className="gap-4 rounded-3xl border p-4" style={{ borderColor, backgroundColor: surface }}>
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: alpha(appTheme.colors.primary, 0.14) }}>
              <SymbolView name="chart.pie.fill" size={20} tintColor={appTheme.colors.primary} fallback={<Text style={{ color: appTheme.colors.primary }}>•</Text>} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-base font-bold" style={{ color: appTheme.colors.foreground }}>
                Overall Budget
              </Text>
              <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
                Wallet-wide spending limit.
              </Text>
            </View>
          </View>
          {BUDGET_PERIODS.map((period) => (
            <BudgetField
              key={`overall-${period.key}-${overallBudgetByPeriod.get(period.key) ?? 0}`}
              label={period.label}
              value={overallBudgetByPeriod.get(period.key) ?? null}
              onSave={(nextValue) => updateOverallBudget(period.key, nextValue)}
            />
          ))}
        </View>

        <View className="gap-3 rounded-3xl border p-4" style={{ borderColor, backgroundColor: surface }}>
          <Text className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>
            New Category
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Category name"
            placeholderTextColor={appTheme.colors.muted}
            selectionColor={appTheme.colors.primary}
            className="rounded-2xl px-4 py-3 text-base"
            style={{ color: appTheme.colors.foreground, backgroundColor: appTheme.colors.background, borderColor, borderWidth: 1 }}
          />
          <View className="flex-row flex-wrap gap-2">
            {COLOR_OPTIONS.map((option) => {
              const selected = color === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setColor(option)}
                  className="h-11 w-11 items-center justify-center rounded-full border"
                  style={{ backgroundColor: option, borderColor: selected ? appTheme.colors.foreground : "transparent" }}
                >
                  {selected ? <SymbolView name="checkmark" size={14} tintColor="#fff" fallback={<Text style={{ color: "#fff" }}>✓</Text>} /> : null}
                </Pressable>
              );
            })}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {ICON_OPTIONS.map((option) => {
              const selected = icon === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setIcon(option)}
                  className="h-11 w-11 items-center justify-center rounded-2xl border"
                  style={{ backgroundColor: selected ? alpha(color, 0.18) : appTheme.colors.background, borderColor: selected ? color : borderColor }}
                >
                  <SymbolView name={option} size={18} tintColor={selected ? color : appTheme.colors.muted} fallback={<Text style={{ color: selected ? color : appTheme.colors.muted }}>•</Text>} />
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={handleCreate}
            className="min-h-12 items-center justify-center rounded-2xl px-4"
            style={{ backgroundColor: name.trim() ? appTheme.colors.primary : alpha(appTheme.colors.primary, 0.28) }}
          >
            <Text className="font-bold" style={{ color: appTheme.colors.inverseForeground }}>
              Create Category
            </Text>
          </Pressable>
        </View>

        <View className="gap-3">
          {categories.map((category) => {
            const categoryColor = category.color ?? appTheme.colors.primary;
            const categoryIcon = (category.icon ?? "tag.fill") as SFSymbol;
            return (
              <View key={category.id} className="gap-4 rounded-3xl border p-4" style={{ borderColor, backgroundColor: surface }}>
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: alpha(categoryColor, 0.16) }}>
                    <SymbolView name={categoryIcon} size={20} tintColor={categoryColor} fallback={<Text style={{ color: categoryColor }}>•</Text>} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-base font-bold" style={{ color: appTheme.colors.foreground }}>
                      {category.name}
                    </Text>
                    <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
                      Category budget
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${category.name}`}
                    onPress={() => confirmDelete(category.id, category.name)}
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: alpha(appTheme.colors.negative, appTheme.isDark ? 0.18 : 0.1) }}
                  >
                    <SymbolView name="trash.fill" size={16} tintColor={appTheme.colors.negative} fallback={<Text style={{ color: appTheme.colors.negative }}>×</Text>} />
                  </Pressable>
                </View>
                {BUDGET_PERIODS.map((period) => {
                  const value = categoryBudgetValue(category, period.key);
                  return (
                    <BudgetField
                      key={`${category.id}-${period.key}-${value ?? 0}`}
                      label={period.label}
                      value={value}
                      onSave={(nextValue) => updateCategoryBudget(category.id, period.key, nextValue)}
                    />
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}
