import { Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { router, Stack } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useState } from "react";

import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import { alpha } from "@/lib/color";

function formatAmountInput(value: number | null) {
  return value ? String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
}

function parseAmountInput(value: string) {
  const parsed = parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function QuickFillFormSheet() {
  const appTheme = useAppTheme();
  const currency = useCurrency();
  const { activeManagement, categories, quickFills, createQuickFill, deleteQuickFill } = useCashflowData();
  const [label, setLabel] = useState("");
  const [amountText, setAmountText] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
  const surface = appTheme.isDark ? "rgba(255,255,255,0.055)" : "rgba(15,23,42,0.035)";
  const selectedCategory = categories.find((category) => category.id === categoryId) ?? null;

  const handleCreate = async () => {
    const trimmed = label.trim();
    if (!trimmed) return;

    const displayAmount = parseAmountInput(amountText);
    const amount = displayAmount === null ? null : Math.round(currency.toIdr(displayAmount));

    await createQuickFill({ label: trimmed, amount, categoryId });
    setLabel("");
    setAmountText("");
    setCategoryId(null);
  };

  const confirmDelete = (id: string, quickFillLabel: string) => {
    Alert.alert("Remove quick fill?", `${quickFillLabel} will no longer appear as an entry shortcut.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteQuickFill(id) },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Quick Fill" }} />
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
            Quick Fill
          </Text>
          <Text className="text-sm leading-5" style={{ color: appTheme.colors.muted }}>
            Save frequent spending labels, amounts, and categories for the quick-fill row in entry-form.
          </Text>
        </View>

        <View className="gap-3 rounded-3xl border p-4" style={{ borderColor, backgroundColor: surface }}>
          <Text className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>
            New Quick Fill
          </Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Shortcut label"
            placeholderTextColor={appTheme.colors.muted}
            selectionColor={appTheme.colors.primary}
            className="rounded-2xl px-4 py-3 text-base"
            style={{ color: appTheme.colors.foreground, backgroundColor: appTheme.colors.background, borderColor, borderWidth: 1 }}
          />
          <TextInput
            value={amountText ? `${currency.option.symbol} ${amountText}` : ""}
            onChangeText={(text) => setAmountText(formatAmountInput(parseAmountInput(text)))}
            placeholder="Default amount"
            placeholderTextColor={appTheme.colors.muted}
            keyboardType="number-pad"
            selectionColor={appTheme.colors.primary}
            className="rounded-2xl px-4 py-3 text-base"
            style={{ color: appTheme.colors.foreground, backgroundColor: appTheme.colors.background, borderColor, borderWidth: 1 }}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: categoryId === null }}
              onPress={() => setCategoryId(null)}
              className="min-h-10 flex-row items-center rounded-full border px-3"
              style={{ backgroundColor: categoryId === null ? alpha(appTheme.colors.primary, 0.14) : appTheme.colors.background, borderColor: categoryId === null ? appTheme.colors.primary : borderColor }}
            >
              <Text className="text-sm font-semibold" style={{ color: categoryId === null ? appTheme.colors.primary : appTheme.colors.foreground }}>
                No category
              </Text>
            </Pressable>
            {categories.map((category) => {
              const color = category.color ?? appTheme.colors.primary;
              const selected = categoryId === category.id;
              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setCategoryId(category.id)}
                  className="min-h-10 flex-row items-center gap-1.5 rounded-full border px-3"
                  style={{ backgroundColor: selected ? alpha(color, 0.18) : appTheme.colors.background, borderColor: selected ? color : borderColor }}
                >
                  <SymbolView name={(category.icon ?? "tag.fill") as SFSymbol} size={14} tintColor={color} fallback={<Text style={{ color }}>•</Text>} />
                  <Text className="text-sm font-semibold" style={{ color: selected ? color : appTheme.colors.foreground }}>
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            onPress={handleCreate}
            className="min-h-12 items-center justify-center rounded-2xl px-4"
            style={{ backgroundColor: label.trim() ? appTheme.colors.primary : alpha(appTheme.colors.primary, 0.28) }}
          >
            <Text className="font-bold" style={{ color: appTheme.colors.inverseForeground }}>
              Create Quick Fill
            </Text>
          </Pressable>
          {selectedCategory ? (
            <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
              New entries will preload {selectedCategory.name}.
            </Text>
          ) : null}
        </View>

        <View className="gap-3">
          {quickFills.map((quickFill) => {
            const category = categories.find((item) => item.id === quickFill.categoryId) ?? null;
            const color = category?.color ?? appTheme.colors.primary;

            return (
              <View key={quickFill.id} className="rounded-3xl border p-4" style={{ borderColor, backgroundColor: surface }}>
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: alpha(color, 0.16) }}>
                    <SymbolView name={(category?.icon ?? "bolt.fill") as SFSymbol} size={20} tintColor={color} fallback={<Text style={{ color }}>•</Text>} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-base font-bold" style={{ color: appTheme.colors.foreground }}>
                      {quickFill.label}
                    </Text>
                    <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
                      {[quickFill.amount ? currency.format(quickFill.amount, { compact: true }) : null, category?.name ?? "No category"].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${quickFill.label}`}
                    onPress={() => confirmDelete(quickFill.id, quickFill.label)}
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: alpha(appTheme.colors.negative, appTheme.isDark ? 0.18 : 0.1) }}
                  >
                    <SymbolView name="trash.fill" size={16} tintColor={appTheme.colors.negative} fallback={<Text style={{ color: appTheme.colors.negative }}>×</Text>} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}
