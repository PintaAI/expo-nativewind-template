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
import { colorsToThemeSet, extractColors } from "@/lib/palette";
import { getManagementImageSource } from "@/lib/protectedImage";

export default function WalletFormSheet() {
  const appTheme = useAppTheme();
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { activeManagementId, managements, setActiveManagementId, updateManagementImageTheme } = useCashflowData();

  const applyWalletTheme = async (management: (typeof managements)[number]) => {
    const image = management.image?.trim();
    if (!image || image.startsWith("symbol:")) return;

    if (management.imageTheme?.image === image) {
      const hasSavedTheme = appTheme.availableThemes.some((theme) => theme.slug === management.imageTheme?.themeSlug);
      if (hasSavedTheme) {
        appTheme.setTheme(management.imageTheme.themeSlug);
      } else {
        const savedTheme = await appTheme.saveTheme(`${management.name} Wallet`, management.imageTheme.themeSet);
        await updateManagementImageTheme(management.id, {
          ...management.imageTheme,
          themeSlug: savedTheme.slug,
        });
      }
      return;
    }

    const imageSource = getManagementImageSource(image);
    const uri = typeof imageSource === "number" ? null : imageSource?.uri;
    if (!uri) return;

    const colors = await extractColors(uri, typeof imageSource === "number" ? undefined : imageSource?.headers);
    const themeSet = colorsToThemeSet(colors);
    const savedTheme = await appTheme.saveTheme(`${management.name} Wallet`, themeSet);
    await updateManagementImageTheme(management.id, {
      version: 1,
      image,
      themeSlug: savedTheme.slug,
      themeSet,
    });
  };

  const handleSelectManagement = async (management: (typeof managements)[number]) => {
    try {
      await setActiveManagementId(management.id);
    } catch (error) {
      console.error("Failed to set active management", error);
    }
    void applyWalletTheme(management).catch((error) => console.error("Failed to apply wallet image theme", error));
  };

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
            const walletPrimary = management.imageTheme?.themeSet[appTheme.resolvedScheme]["--color-primary"] ?? appTheme.colors.primary;
            return (
              <Pressable
                key={management.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => handleSelectManagement(management)}
                className="rounded-3xl border p-4"
                style={{
                  backgroundColor: alpha(walletPrimary, isActive ? (appTheme.isDark ? 0.18 : 0.1) : appTheme.isDark ? 0.1 : 0.065),
                  borderColor: isActive ? alpha(walletPrimary, 0.6) : alpha(walletPrimary, appTheme.isDark ? 0.34 : 0.22),
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-2xl" style={{ backgroundColor: alpha(walletPrimary, 0.16) }}>
                    {imageSource ? (
                      <Image
                        source={imageSource}
                        contentFit="cover"
                        onError={(error) => console.warn("[management] image failed", management.id, error)}
                        onLoad={() => console.log("[management] image loaded", management.id)}
                        style={{ height: "100%", width: "100%" }}
                      />
                    ) : (
                      <SymbolView name={walletImageToIcon(management.image)} size={20} tintColor={walletPrimary} fallback={<Text style={{ color: walletPrimary }}>•</Text>} />
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
                      <Text className="text-xs font-semibold" style={{ color: walletPrimary }}>
                        {t("wallet.active")}
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
