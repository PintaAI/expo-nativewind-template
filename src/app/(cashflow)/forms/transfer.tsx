import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, TextInput, View } from "react-native";
import ExpoDateTimePicker from "@expo/ui/community/datetime-picker";
import { GlassView } from "expo-glass-effect";
import { router, Stack } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import type { CashflowManagement } from "@/data/cashflow/types";
import { alpha } from "@/lib/color";
import { formatDateKey, toDateKey } from "@/lib/date";

const DATE_OPTIONS = [
  { label: "Today", daysAgo: 0 },
  { label: "Yesterday", daysAgo: 1 },
  { label: "Date" },
];

function getDateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function formatAmountDigits(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function WalletChoice({ wallet, selected, disabled, onPress }: { wallet: CashflowManagement; selected: boolean; disabled?: boolean; onPress: () => void }) {
  const appTheme = useAppTheme();
  const currency = useCurrency();
  const tint = wallet.balance < 0 ? appTheme.colors.negative : appTheme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      className="min-h-16 flex-row items-center gap-3 rounded-3xl border px-4 py-3"
      onPress={onPress}
      style={{
        backgroundColor: selected ? alpha(tint, appTheme.isDark ? 0.2 : 0.11) : (appTheme.isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)"),
        borderColor: selected ? alpha(tint, 0.55) : (appTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)"),
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: alpha(tint, 0.15) }}>
        <SymbolView name="wallet.pass.fill" size={18} tintColor={tint} fallback={<Text style={{ color: tint }}>•</Text>} />
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-base font-bold" style={{ color: appTheme.colors.foreground }}>
          {wallet.name}
        </Text>
        <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
          {currency.format(wallet.balance, { compact: true })}
        </Text>
      </View>
      {selected ? <SymbolView name="checkmark.circle.fill" size={20} tintColor={tint} fallback={<Text style={{ color: tint }}>✓</Text>} /> : null}
    </Pressable>
  );
}

function DateChoice({ label, subtitle, selected, onPress }: { label: string; subtitle: string; selected: boolean; onPress: () => void }) {
  const appTheme = useAppTheme();
  const borderColor = selected ? alpha(appTheme.colors.primary, 0.45) : (appTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)");

  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-14 flex-1 items-center justify-center gap-1 rounded-2xl border px-2 py-2"
      onPress={onPress}
      style={{
        backgroundColor: selected ? alpha(appTheme.colors.primary, appTheme.isDark ? 0.2 : 0.12) : (appTheme.isDark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.45)"),
        borderColor,
      }}
    >
      <Text className="text-sm font-semibold" style={{ color: selected ? appTheme.colors.primary : appTheme.colors.foreground }}>
        {label}
      </Text>
      <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

function Section({ title, icon, children }: { title: string; icon: SFSymbol; children: React.ReactNode }) {
  const appTheme = useAppTheme();

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2 px-1">
        <SymbolView name={icon} size={14} tintColor={appTheme.colors.muted} fallback={<Text style={{ color: appTheme.colors.muted }}>•</Text>} />
        <Text className="text-xs font-semibold uppercase tracking-wide" style={{ color: appTheme.colors.muted }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

export default function TransferFormSheet() {
  const appTheme = useAppTheme();
  const { t } = useTranslation();
  const currency = useCurrency();
  const { activeManagementId, managements, createTransfer } = useCashflowData();
  const [fromManagementId, setFromManagementId] = useState(activeManagementId ?? managements[0]?.id ?? "");
  const [toManagementId, setToManagementId] = useState(managements.find((wallet) => wallet.id !== (activeManagementId ?? managements[0]?.id))?.id ?? "");
  const [amountText, setAmountText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [dateIndex, setDateIndex] = useState(0);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (fromManagementId || managements.length === 0) return;
    queueMicrotask(() => setFromManagementId(activeManagementId ?? managements[0]?.id ?? ""));
  }, [activeManagementId, fromManagementId, managements]);

  useEffect(() => {
    if (toManagementId || managements.length < 2) return;
    queueMicrotask(() => setToManagementId(managements.find((wallet) => wallet.id !== fromManagementId)?.id ?? ""));
  }, [fromManagementId, managements, toManagementId]);

  const fromManagement = managements.find((wallet) => wallet.id === fromManagementId) ?? null;
  const toManagement = managements.find((wallet) => wallet.id === toManagementId) ?? null;
  const selectedDate = DATE_OPTIONS[dateIndex]?.daysAgo !== undefined
    ? getDateDaysAgo(DATE_OPTIONS[dateIndex].daysAgo)
    : customDate ?? new Date();
  const displayNominal = parseInt(amountText, 10) || 0;
  const nominal = Math.round(currency.toIdr(displayNominal));
  const canSubmit = managements.length >= 2 && fromManagementId && toManagementId && fromManagementId !== toManagementId && nominal > 0 && !isSaving;
  const preview = useMemo(() => {
    if (!fromManagement || !toManagement || nominal <= 0) return null;
    return {
      fromBalance: fromManagement.balance - nominal,
      toBalance: toManagement.balance + nominal,
    };
  }, [fromManagement, nominal, toManagement]);

  const handleSave = async () => {
    if (managements.length < 2) {
      Alert.alert(t("transfer.addWalletTitle"), t("transfer.addWalletMessage"));
      return;
    }
    if (!fromManagement || !toManagement || fromManagementId === toManagementId) {
      Alert.alert(t("transfer.chooseWalletTitle"), t("transfer.chooseWalletMessage"));
      return;
    }
    if (nominal <= 0) {
      Alert.alert(t("transfer.amountRequiredTitle"), t("transfer.amountRequiredMessage"));
      return;
    }
    if (fromManagement.balance < nominal) {
      Alert.alert(t("transfer.insufficientFundsTitle"), t("transfer.insufficientFundsMessage", { name: fromManagement.name, balance: currency.format(fromManagement.balance) }));
      return;
    }

    setIsSaving(true);
    try {
      await createTransfer({
        fromManagementId,
        toManagementId,
        nominal,
        originalNominal: displayNominal,
        originalCurrency: currency.currency,
        exchangeRateToIdr: currency.isIdr ? 1 : 1 / currency.rate,
        exchangeRateAt: new Date().toISOString(),
        date: toDateKey(selectedDate),
        note: noteText,
      });
      router.back();
    } catch (error) {
      Alert.alert(t("transfer.transferFailedTitle"), error instanceof Error ? error.message : t("transfer.transferFailedMessage"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t("sidebar.transfer") }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" onPress={() => router.back()} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="checkmark" disabled={!canSubmit} onPress={handleSave} variant="done">
          {t("sidebar.transfer")}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>

      <ScrollView
        className="flex-1 bg-[--app-color-background]"
        contentContainerClassName="gap-5 px-5 pb-10 pt-5"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-3 py-3">
          <View className="h-14 w-14 items-center justify-center rounded-3xl" style={{ backgroundColor: alpha(appTheme.colors.primary, appTheme.isDark ? 0.22 : 0.12) }}>
            <SymbolView name="arrow.left.arrow.right" size={24} tintColor={appTheme.colors.primary} fallback={<Text style={{ color: appTheme.colors.primary }}>⇄</Text>} />
          </View>
          <TextInput
            className="w-full text-center text-6xl font-black tracking-tight"
            inputMode="numeric"
            keyboardType="number-pad"
            placeholder={`${currency.option.symbol} 0`}
            placeholderTextColor={appTheme.colors.muted}
            selectionColor={appTheme.colors.primary}
            value={amountText ? `${currency.option.symbol} ${formatAmountDigits(amountText)}` : ""}
            onChangeText={(text) => setAmountText(text.replace(/\D/g, ""))}
            style={{ color: appTheme.colors.foreground, height: 78, includeFontPadding: false, paddingVertical: 0 }}
          />
          <GlassView
            isInteractive
            tintColor={alpha(appTheme.colors.primary, appTheme.isDark ? 0.35 : 0.18)}
            glassEffectStyle="clear"
            style={{ borderRadius: 9999, minHeight: 42, width: "100%" }}
          >
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder={t("transfer.notePlaceholder")}
              placeholderTextColor={appTheme.colors.muted}
              selectionColor={appTheme.colors.primary}
              style={{ color: appTheme.colors.foreground, fontSize: 16, minHeight: 42, paddingHorizontal: 16, paddingVertical: 0 }}
            />
          </GlassView>
        </View>

        <Section title={t("transfer.fromWallet")} icon="arrow.up.circle.fill">
          <View className="gap-2">
            {managements.map((wallet) => (
              <WalletChoice
                key={wallet.id}
                wallet={wallet}
                selected={wallet.id === fromManagementId}
                disabled={wallet.id === toManagementId}
                onPress={() => setFromManagementId(wallet.id)}
              />
            ))}
          </View>
        </Section>

        <Section title={t("transfer.toWallet")} icon="arrow.down.circle.fill">
          <View className="gap-2">
            {managements.map((wallet) => (
              <WalletChoice
                key={wallet.id}
                wallet={wallet}
                selected={wallet.id === toManagementId}
                disabled={wallet.id === fromManagementId}
                onPress={() => setToManagementId(wallet.id)}
              />
            ))}
          </View>
        </Section>

        {preview && fromManagement && toManagement ? (
          <View className="rounded-3xl border p-4" style={{ backgroundColor: appTheme.isDark ? "rgba(255,255,255,0.045)" : "rgba(15,23,42,0.035)", borderColor: appTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)" }}>
            <View className="flex-row items-center justify-between gap-4">
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>{fromManagement.name}</Text>
                <Text className="text-xs" style={{ color: appTheme.colors.muted }}>{currency.format(fromManagement.balance)} → {currency.format(preview.fromBalance)}</Text>
              </View>
              <SymbolView name="arrow.right" size={16} tintColor={appTheme.colors.muted} fallback={<Text style={{ color: appTheme.colors.muted }}>→</Text>} />
              <View className="min-w-0 flex-1 items-end">
                <Text numberOfLines={1} className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>{toManagement.name}</Text>
                <Text className="text-xs" style={{ color: appTheme.colors.muted }}>{currency.format(toManagement.balance)} → {currency.format(preview.toBalance)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        <Section title={t("transfer.transferDate")} icon="calendar">
          <View className="flex-row gap-2">
            {DATE_OPTIONS.map((option, index) => (
              <DateChoice
                key={index}
                label={index === 0 ? t("entry.dateOptions.today") : index === 1 ? t("entry.dateOptions.yesterday") : t("entry.dateOptions.date")}
                subtitle={option.daysAgo !== undefined ? formatDateKey(toDateKey(getDateDaysAgo(option.daysAgo)), { day: "numeric", month: "short" }) : formatDateKey(toDateKey(customDate ?? new Date()), { day: "numeric", month: "short" })}
                selected={dateIndex === index}
                onPress={() => {
                  setDateIndex(index);
                  if (option.daysAgo === undefined) setShowDatePicker(true);
                }}
              />
            ))}
          </View>
        </Section>

        {managements.length < 2 ? (
          <View className="rounded-3xl border p-4" style={{ backgroundColor: alpha(appTheme.colors.negative, 0.1), borderColor: alpha(appTheme.colors.negative, 0.28) }}>
            <Text className="text-sm font-semibold" style={{ color: appTheme.colors.negative }}>
              {t("transfer.addWalletHint")}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {showDatePicker ? (
        <Modal transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
          <Pressable className="flex-1 justify-end px-4 pb-8" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} onPress={() => setShowDatePicker(false)}>
            <Pressable
              className="rounded-3xl border p-4"
              style={{
                backgroundColor: appTheme.colors.background,
                borderColor: appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)",
              }}
            >
              <ExpoDateTimePicker
                value={customDate ?? new Date()}
                mode="date"
                presentation="inline"
                display="inline"
                accentColor={appTheme.colors.primary}
                onValueChange={(_event, date) => {
                  setCustomDate(date);
                  setDateIndex(2);
                  setShowDatePicker(false);
                }}
                onDismiss={() => setShowDatePicker(false)}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}
