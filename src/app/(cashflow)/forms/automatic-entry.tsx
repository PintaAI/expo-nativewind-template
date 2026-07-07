import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import SegmentedControl from "@expo/ui/community/segmented-control";
import { router, Stack } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";

import { useTranslation } from "react-i18next";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import type { RecurringFrequency } from "@/data/cashflow/types";
import { alpha } from "@/lib/color";
import { formatDateKey, toDateKey } from "@/lib/date";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const satisfies readonly { value: RecurringFrequency; label: string }[];

function formatAmountInput(value: number | null) {
  return value ? String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
}

function parseAmountInput(value: string) {
  const parsed = parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export default function AutomaticEntryFormSheet() {
  const appTheme = useAppTheme();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { activeManagement, categories, recurringEntries, createRecurringEntry, deleteRecurringEntry } = useCashflowData();
  const [name, setName] = useState("");
  const [amountText, setAmountText] = useState("");
  const [ioIndex, setIoIndex] = useState(1);
  const [frequencyIndex, setFrequencyIndex] = useState(1);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState(() => toDateKey(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
  const surface = appTheme.isDark ? "rgba(255,255,255,0.055)" : "rgba(15,23,42,0.035)";

  const handleCreate = async () => {
    const trimmed = name.trim();
    const nominal = parseAmountInput(amountText);

    if (!trimmed) {
      Alert.alert(t("autoEntry.nameRequiredTitle"), t("autoEntry.nameRequiredMessage"));
      return;
    }

    if (!nominal) {
      Alert.alert(t("autoEntry.amountRequiredTitle"), t("autoEntry.amountRequiredMessage"));
      return;
    }

    await createRecurringEntry({
      name: trimmed,
      nominal,
      categoryId,
      io: ioIndex === 0 ? "Income" : "Expenses",
      frequency: FREQUENCIES[frequencyIndex].value,
      nextDate,
    });

    setName("");
    setAmountText("");
    setIoIndex(1);
    setFrequencyIndex(1);
    setCategoryId(null);
    setNextDate(toDateKey(new Date()));
  };

  const confirmDelete = (id: string, entryName: string) => {
    Alert.alert(t("autoEntry.removeTitle"), t("autoEntry.removeMessage", { name: entryName }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.remove"), style: "destructive", onPress: () => deleteRecurringEntry(id) },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Catat Otomatis" }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" onPress={() => router.back()} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="checkmark" onPress={handleCreate} variant="done">
          Simpan
        </Stack.Toolbar.Button>
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
            {t("autoEntry.heading")}
          </Text>
          <Text className="text-sm leading-5" style={{ color: appTheme.colors.muted }}>
            {t("autoEntry.description")}
          </Text>
        </View>

        <View className="gap-3 rounded-3xl border p-4" style={{ borderColor, backgroundColor: surface }}>
          <Text className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>
            {t("autoEntry.newEntry")}
          </Text>
          <SegmentedControl
            values={[t("entry.income"), t("entry.expense")]}
            selectedIndex={ioIndex}
            onChange={(event) => setIoIndex(event.nativeEvent.selectedSegmentIndex)}
            tintColor={appTheme.colors.primary}
            appearance={appTheme.isDark ? "dark" : "light"}
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("autoEntry.entryNamePlaceholder")}
            placeholderTextColor={appTheme.colors.muted}
            selectionColor={appTheme.colors.primary}
            className="rounded-2xl px-4 py-3 text-base"
            style={{ color: appTheme.colors.foreground, backgroundColor: appTheme.colors.background, borderColor, borderWidth: 1 }}
          />
          <TextInput
            value={amountText ? `Rp ${amountText}` : ""}
            onChangeText={(text) => setAmountText(formatAmountInput(parseAmountInput(text)))}
            placeholder={t("autoEntry.amountPlaceholder")}
            placeholderTextColor={appTheme.colors.muted}
            keyboardType="number-pad"
            selectionColor={appTheme.colors.primary}
            className="rounded-2xl px-4 py-3 text-base"
            style={{ color: appTheme.colors.foreground, backgroundColor: appTheme.colors.background, borderColor, borderWidth: 1 }}
          />
          <View className="flex-row gap-2">
            {FREQUENCIES.map((frequency, index) => {
              const selected = frequencyIndex === index;
              return (
                <Pressable
                  key={frequency.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setFrequencyIndex(index)}
                  className="min-h-11 flex-1 items-center justify-center rounded-2xl border px-2"
                  style={{ backgroundColor: selected ? alpha(appTheme.colors.primary, 0.16) : appTheme.colors.background, borderColor: selected ? appTheme.colors.primary : borderColor }}
                >
                  <Text className="text-sm font-bold" style={{ color: selected ? appTheme.colors.primary : appTheme.colors.foreground }}>
                    {t(`autoEntry.${frequency.value}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowDatePicker(true)}
            className="min-h-12 flex-row items-center justify-between rounded-2xl border px-4"
            style={{ backgroundColor: appTheme.colors.background, borderColor }}
          >
            <Text className="text-base" style={{ color: appTheme.colors.foreground }}>
              {t("autoEntry.nextRun")}
            </Text>
            <Text className="text-base font-bold" style={{ color: appTheme.colors.primary }}>
              {formatDateKey(nextDate)}
            </Text>
          </Pressable>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: categoryId === null }}
              onPress={() => setCategoryId(null)}
              className="min-h-10 flex-row items-center rounded-full border px-3"
              style={{ backgroundColor: categoryId === null ? alpha(appTheme.colors.primary, 0.14) : appTheme.colors.background, borderColor: categoryId === null ? appTheme.colors.primary : borderColor }}
            >
              <Text className="text-sm font-semibold" style={{ color: categoryId === null ? appTheme.colors.primary : appTheme.colors.foreground }}>
                {t("autoEntry.noCategory")}
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
        </View>

        <View className="gap-3">
          {recurringEntries.map((entry) => {
            const category = categories.find((item) => item.id === entry.categoryId) ?? null;
            const color = entry.io === "Income" ? appTheme.colors.positive : (category?.color ?? appTheme.colors.negative);
            const frequencyLabel = t(`autoEntry.${entry.frequency}`);

            return (
              <View key={entry.id} className="rounded-3xl border p-4" style={{ borderColor, backgroundColor: surface }}>
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: alpha(color, 0.16) }}>
                    <SymbolView name="repeat.circle.fill" size={22} tintColor={color} fallback={<Text style={{ color }}>•</Text>} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-base font-bold" style={{ color: appTheme.colors.foreground }}>
                      {entry.name}
                    </Text>
                    <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
                      {[format(entry.nominal, { compact: true }), entry.io, frequencyLabel, category?.name ?? t("autoEntry.noCategory")].join(" · ")}
                    </Text>
                    <Text className="mt-1 text-xs font-semibold" style={{ color: appTheme.colors.primary }}>
                      {t("autoEntry.nextLabel", { date: formatDateKey(entry.nextDate) })}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("autoEntry.removeMessage", { name: entry.name }).replace(/\.+$/, "")}
                    onPress={() => confirmDelete(entry.id, entry.name)}
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

      {showDatePicker && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
          <Pressable className="flex-1 justify-end px-4 pb-8" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} onPress={() => setShowDatePicker(false)}>
            <Pressable className="rounded-3xl border p-4" style={{ backgroundColor: appTheme.colors.background, borderColor }}>
              <DateTimePicker
                value={new Date(`${nextDate}T12:00:00`)}
                mode="date"
                presentation="inline"
                display="inline"
                accentColor={appTheme.colors.primary}
                onValueChange={(_event, date) => {
                  if (date) setNextDate(toDateKey(date));
                  setShowDatePicker(false);
                }}
                onDismiss={() => setShowDatePicker(false)}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}
