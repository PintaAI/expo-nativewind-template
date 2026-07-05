import { Pressable, ScrollView, View } from "react-native";
import { GlassView } from "expo-glass-effect";
import { router, Stack, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "expo-symbols";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import { alpha } from "@/lib/color";

const walletSymbols = ["wallet.pass.fill", "house.fill", "briefcase.fill", "person.2.fill", "creditcard.fill"] satisfies SFSymbol[];

function walletIconName(image: string | null): SFSymbol {
  const symbol = image?.startsWith("symbol:") ? image.replace("symbol:", "") : "wallet.pass.fill";
  return (walletSymbols as readonly SFSymbol[]).includes(symbol as SFSymbol) ? (symbol as SFSymbol) : "wallet.pass.fill";
}

export default function WalletFormSheet() {
  const appTheme = useAppTheme();
  const { format } = useCurrency();
  const { activeManagementId, managements, setActiveManagementId } = useCashflowData();
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
  const surface = appTheme.isDark ? "rgba(255,255,255,0.055)" : "rgba(15,23,42,0.035)";

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.View hidesSharedBackground>
          <GlassView
            isInteractive
            tintColor={alpha(appTheme.colors.primary, appTheme.isDark ? 1 : 0.72)}
            glassEffectStyle="clear"
            style={{ borderRadius: 9999 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add wallet"
              className="flex-row items-center gap-1.5 px-5 py-3"
              onPress={() => router.push("/forms/wallet/detail" as Href)}
            >
              <SymbolView name="plus" size={16} tintColor={appTheme.colors.background} fallback={<Text className="text-base" style={{ color: appTheme.colors.background }}>+</Text>} />
              <Text className="text-base font-bold" style={{ color: appTheme.colors.background }}>
                Wallet
              </Text>
            </Pressable>
          </GlassView>
        </Stack.Toolbar.View>
      </Stack.Toolbar>

      <ScrollView className="bg-[--app-color-background] flex-1" contentContainerClassName="gap-5 px-5 pb-10 pt-5" contentInsetAdjustmentBehavior="automatic">
        <View className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-[2px]" style={{ color: appTheme.colors.muted }}>
            Data Scope
          </Text>
          <Text className="text-3xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
            Choose Wallet
          </Text>
          <Text className="text-sm leading-5" style={{ color: appTheme.colors.muted }}>
            Entries, categories, budgets, quick fills, and summaries follow the active wallet.
          </Text>
        </View>

        <View className="gap-3">
          {managements.map((management) => {
            const isActive = management.id === activeManagementId;
            return (
              <Pressable
                key={management.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => setActiveManagementId(management.id)}
                className="rounded-3xl border p-4"
                style={{
                  backgroundColor: isActive ? alpha(appTheme.colors.primary, appTheme.isDark ? 0.18 : 0.1) : surface,
                  borderColor: isActive ? alpha(appTheme.colors.primary, 0.55) : borderColor,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: alpha(appTheme.colors.primary, 0.14) }}>
                    <SymbolView name={walletIconName(management.image)} size={20} tintColor={appTheme.colors.primary} fallback={<Text style={{ color: appTheme.colors.primary }}>•</Text>} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-base font-bold" style={{ color: appTheme.colors.foreground }}>
                      {management.name}
                    </Text>
                    <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
                      {management.entryCount} entries · {management.memberCount} member{management.memberCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-sm font-bold" style={{ color: management.balance < 0 ? appTheme.colors.negative : appTheme.colors.foreground }}>
                      {format(management.balance, { compact: true })}
                    </Text>
                    {isActive ? (
                      <Text className="text-xs font-semibold" style={{ color: appTheme.colors.primary }}>
                        Active
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/forms/wallet/detail", params: { id: management.id } } as Href)}
                  className="mt-4 min-h-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: appTheme.colors.background }}
                >
                  <Text className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>
                    Manage Wallet
                  </Text>
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}
