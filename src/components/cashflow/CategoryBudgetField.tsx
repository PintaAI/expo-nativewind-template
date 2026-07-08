import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";

export function formatBudgetInput(value: number | null) {
  return value ? String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
}

export function parseBudgetInput(value: string) {
  const parsed = parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function BudgetField({ label, value, onSave }: { label: string; value: number | null; onSave: (value: number | null) => Promise<void> }) {
  const appTheme = useAppTheme();
  const { t } = useTranslation();
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
        <Pressable accessibilityRole="button" onPress={() => onSave(parsedDraft)} className="min-h-11 items-center justify-center rounded-2xl px-3" style={{ backgroundColor: appTheme.colors.primary }}>
          <Text className="text-xs font-bold" style={{ color: appTheme.colors.inverseForeground }}>
            {t("common.save")}
          </Text>
        </Pressable>
      </View>
      {value ? (
        <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
          {t("categories.current", { value: format(value, { compact: true }) })}
        </Text>
      ) : null}
    </View>
  );
}
