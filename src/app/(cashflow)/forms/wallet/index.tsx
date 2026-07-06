import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { GlassView } from "expo-glass-effect";
import { Image } from "expo-image";
import { router, Stack, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "expo-symbols";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import { alpha } from "@/lib/color";
import { colorsToThemeSet, extractColors } from "@/lib/palette";
import { getManagementImageSource } from "@/lib/protectedImage";

const walletSymbols = ["wallet.pass.fill", "house.fill", "briefcase.fill", "person.2.fill", "creditcard.fill"] satisfies SFSymbol[];

function walletIconName(image: string | null): SFSymbol {
  const symbol = image?.startsWith("symbol:") ? image.replace("symbol:", "") : "wallet.pass.fill";
  return (walletSymbols as readonly SFSymbol[]).includes(symbol as SFSymbol) ? (symbol as SFSymbol) : "wallet.pass.fill";
}

export default function WalletFormSheet() {
  const appTheme = useAppTheme();
  const { format } = useCurrency();
  const { activeManagementId, managements, setActiveManagementId, updateManagementImageTheme } = useCashflowData();
  const [applyingManagementId, setApplyingManagementId] = useState<string | null>(null);
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
  const surface = appTheme.isDark ? "rgba(255,255,255,0.055)" : "rgba(15,23,42,0.035)";

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
    setApplyingManagementId(management.id);
    try {
      await applyWalletTheme(management);
      await setActiveManagementId(management.id);
    } catch (error) {
      console.error("Failed to apply wallet image theme", error);
      await setActiveManagementId(management.id);
    } finally {
      setApplyingManagementId(null);
    }
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
            const imageSource = getManagementImageSource(management.image);
            const walletPrimary = management.imageTheme?.themeSet[appTheme.resolvedScheme]["--color-primary"] ?? appTheme.colors.primary;
            return (
              <Pressable
                key={management.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                disabled={applyingManagementId !== null}
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
                      <SymbolView name={walletIconName(management.image)} size={20} tintColor={walletPrimary} fallback={<Text style={{ color: walletPrimary }}>•</Text>} />
                    )}
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
                    {applyingManagementId === management.id ? (
                      <Text className="text-xs font-semibold" style={{ color: walletPrimary }}>
                        Theming
                      </Text>
                    ) : isActive ? (
                      <Text className="text-xs font-semibold" style={{ color: walletPrimary }}>
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
