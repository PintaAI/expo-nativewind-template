import { Pressable, ScrollView, View } from "react-native";
import { GlassView } from "expo-glass-effect";
import { Image } from "expo-image";
import { router, Stack, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useTranslation } from "react-i18next";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import { alpha } from "@/lib/color";
import { walletImageToIcon } from "@/lib/categoryMapping";
import { getManagementImageSource } from "@/lib/protectedImage";

export default function WalletFormSheet() {
  const appTheme = useAppTheme();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { activeManagementId, managements, setActiveManagementId } = useCashflowData();
  const borderColor = alpha(appTheme.colors.foreground, appTheme.isDark ? 0.09 : 0.07);
  const rowSurface = alpha(appTheme.colors.foreground, appTheme.isDark ? 0.045 : 0.035);
  const surface = alpha(appTheme.colors.foreground, appTheme.isDark ? 0.035 : 0.025);

  const handleSelectManagement = async (management: (typeof managements)[number]) => {
    try {
      await setActiveManagementId(management.id);
    } catch (error) {
      console.error("Failed to set active management", error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t("sidebar.wallet") }} />
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
              accessibilityLabel={t("wallet.addWalletLabel")}
              className="flex-row items-center gap-1.5 px-5 py-3"
              onPress={() => router.push("/forms/wallet/detail" as Href)}
            >
              <SymbolView name="plus" size={16} tintColor={appTheme.colors.background} fallback={<Text className="text-base" style={{ color: appTheme.colors.background }}>+</Text>} />
              <Text className="text-base font-bold" style={{ color: appTheme.colors.background }}>
                {t("sidebar.wallet")}
              </Text>
            </Pressable>
          </GlassView>
        </Stack.Toolbar.View>
      </Stack.Toolbar>

      <ScrollView className="bg-[--app-color-background] flex-1" contentContainerClassName="gap-5 px-5 pb-10 pt-5" contentInsetAdjustmentBehavior="automatic">
        <View className="gap-2">
          <Text className="text-xs font-semibold uppercase tracking-[2px]" style={{ color: appTheme.colors.muted }}>
            {t("wallet.dataScope")}
          </Text>
          <Text className="text-3xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
            {t("wallet.chooseWallet")}
          </Text>
          <Text className="text-sm leading-5" style={{ color: appTheme.colors.muted }}>
            {t("wallet.chooseWalletDescription")}
          </Text>
        </View>

        <View className="gap-3">
          {managements.map((management) => {
            const isActive = management.id === activeManagementId;
            const imageSource = getManagementImageSource(management.image);
            const tint = management.balance < 0 ? appTheme.colors.negative : appTheme.colors.primary;
            return (
              <Pressable
                key={management.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => handleSelectManagement(management)}
                className="rounded-3xl border p-4"
                style={{
                  backgroundColor: surface,
                  borderColor: isActive ? alpha(appTheme.colors.primary, 0.5) : borderColor,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-2xl" style={{ backgroundColor: alpha(tint, 0.14) }}>
                    {imageSource ? (
                      <Image
                        source={imageSource}
                        contentFit="cover"
                        onError={(error) => console.warn("[management] image failed", management.id, error)}
                        onLoad={() => console.log("[management] image loaded", management.id)}
                        style={{ height: "100%", width: "100%" }}
                      />
                    ) : (
                      <SymbolView name={walletImageToIcon(management.image)} size={20} tintColor={tint} fallback={<Text style={{ color: tint }}>•</Text>} />
                    )}
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="text-base font-bold" style={{ color: appTheme.colors.foreground }}>
                      {management.name}
                    </Text>
                    <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
                      {t("wallet.entriesCount", { count: management.entryCount })} · {t("wallet.memberCount", { count: management.memberCount })}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="text-sm font-bold" style={{ color: management.balance < 0 ? appTheme.colors.negative : appTheme.colors.foreground }}>
                      {format(management.balance, { compact: true })}
                    </Text>
                    {isActive ? (
                      <Text className="text-xs font-semibold" style={{ color: appTheme.colors.primary }}>
                        {t("wallet.active")}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/forms/wallet/detail", params: { id: management.id } } as Href)}
                  className="mt-4 min-h-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: rowSurface }}
                >
                  <Text className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>
                    {t("wallet.manageWallet")}
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
