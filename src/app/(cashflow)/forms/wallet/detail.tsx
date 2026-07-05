import { useEffect, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { GlassView } from "expo-glass-effect";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { SFSymbol } from "expo-symbols";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import type { CashflowManagementMember } from "@/data/cashflow/types";
import { alpha } from "@/lib/color";

const iconChoices = ["wallet.pass.fill", "house.fill", "briefcase.fill", "person.2.fill", "creditcard.fill"] satisfies SFSymbol[];

function getIconName(image: string | null): SFSymbol {
  const symbol = image?.startsWith("symbol:") ? image.replace("symbol:", "") : "wallet.pass.fill";
  return (iconChoices as readonly SFSymbol[]).includes(symbol as SFSymbol) ? (symbol as SFSymbol) : "wallet.pass.fill";
}

function isPicture(image: string | null) {
  return !!image && !image.startsWith("symbol:");
}

export default function WalletDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const appTheme = useAppTheme();
  const { managements, createManagement, updateManagement, listManagementMembers } = useCashflowData();
  const isNewWallet = !id;
  const management = managements.find((item) => item.id === id) ?? null;
  const [name, setName] = useState(management?.name ?? "");
  const [image, setImage] = useState(management?.image ?? "symbol:wallet.pass.fill");
  const [members, setMembers] = useState<CashflowManagementMember[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
  const surface = appTheme.isDark ? "rgba(255,255,255,0.055)" : "rgba(15,23,42,0.035)";

  useEffect(() => {
    setName(management?.name ?? "");
    setImage(management?.image ?? "symbol:wallet.pass.fill");
  }, [management]);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    listManagementMembers(id)
      .then((nextMembers) => {
        if (isMounted) setMembers(nextMembers);
      })
      .catch((error) => console.error("Failed to load wallet members", error));

    return () => {
      isMounted = false;
    };
  }, [id, listManagementMembers]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (isNewWallet) {
        await createManagement({ name, image: image.trim() || null });
      } else if (id) {
        await updateManagement(id, { name, image: image.trim() || null });
      }
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isNewWallet && !management) {
    return (
      <View className="flex-1 items-center justify-center bg-[--app-color-background] px-6">
        <Stack.Screen options={{ title: "Wallet Detail" }} />
        <Text className="text-center text-base font-semibold" style={{ color: appTheme.colors.foreground }}>
          Wallet not found.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: isNewWallet ? "New Wallet" : management?.name }} />
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
              accessibilityLabel="Save wallet"
              className="px-6 py-3"
              onPress={handleSave}
              disabled={!name.trim() || isSaving}
              style={{ opacity: name.trim() && !isSaving ? 1 : 0.55 }}
            >
              <Text className="text-base font-bold" style={{ color: appTheme.colors.background }}>
                {isSaving ? "Saving" : "Save"}
              </Text>
            </Pressable>
          </GlassView>
        </Stack.Toolbar.View>
      </Stack.Toolbar>

      <ScrollView className="bg-[--app-color-background] flex-1" contentContainerClassName="gap-5 px-5 pb-10 pt-5" contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">

      <View className="items-center gap-3">
        <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-[28px]" style={{ backgroundColor: alpha(appTheme.colors.primary, 0.14) }}>
          {isPicture(image) ? (
            <Image source={{ uri: image }} className="h-full w-full" contentFit="cover" />
          ) : (
            <SymbolView name={getIconName(image)} size={34} tintColor={appTheme.colors.primary} fallback={<Text style={{ color: appTheme.colors.primary }}>•</Text>} />
          )}
        </View>
        {management ? (
          <>
            <Text className="text-xs font-semibold uppercase tracking-[2px]" style={{ color: appTheme.colors.muted }}>
              Management ID
            </Text>
            <Text selectable className="text-center text-xs" style={{ color: appTheme.colors.muted }}>
              {management.id}
            </Text>
          </>
        ) : (
          <Text className="text-xs font-semibold uppercase tracking-[2px]" style={{ color: appTheme.colors.muted }}>
            New Wallet
          </Text>
        )}
      </View>

      <View className="gap-3 rounded-3xl border p-4" style={{ borderColor, backgroundColor: surface }}>
        <Text className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>
          Wallet Profile
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Wallet name"
          placeholderTextColor={appTheme.colors.muted}
          selectionColor={appTheme.colors.primary}
          className="rounded-2xl px-4 py-3 text-base"
          style={{ color: appTheme.colors.foreground, backgroundColor: appTheme.colors.background, borderColor, borderWidth: 1 }}
        />
        <TextInput
          value={image}
          onChangeText={setImage}
          placeholder="symbol:wallet.pass.fill or image URL"
          placeholderTextColor={appTheme.colors.muted}
          selectionColor={appTheme.colors.primary}
          autoCapitalize="none"
          className="rounded-2xl px-4 py-3 text-base"
          style={{ color: appTheme.colors.foreground, backgroundColor: appTheme.colors.background, borderColor, borderWidth: 1 }}
        />
        <View className="flex-row flex-wrap gap-2">
          {iconChoices.map((icon) => {
            const value = `symbol:${icon}`;
            const isSelected = image === value;
            return (
              <Pressable
                key={icon}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setImage(value)}
                className="h-11 w-11 items-center justify-center rounded-2xl border"
                style={{ backgroundColor: isSelected ? alpha(appTheme.colors.primary, 0.14) : appTheme.colors.background, borderColor: isSelected ? appTheme.colors.primary : borderColor }}
              >
                <SymbolView name={icon} size={19} tintColor={isSelected ? appTheme.colors.primary : appTheme.colors.foreground} fallback={<Text style={{ color: appTheme.colors.foreground }}>•</Text>} />
              </Pressable>
            );
          })}
        </View>
      </View>

        {management ? (
          <View className="gap-3 rounded-3xl border p-4" style={{ borderColor, backgroundColor: surface }}>
            <Text className="text-sm font-bold" style={{ color: appTheme.colors.foreground }}>
              Members
            </Text>
            {members.map((member) => (
              <View key={member.id} className="flex-row items-center gap-3 rounded-2xl px-1 py-2">
                <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: alpha(appTheme.colors.primary, 0.14) }}>
                  {member.image ? (
                    <Image source={{ uri: member.image }} className="h-full w-full" contentFit="cover" />
                  ) : (
                    <Text className="font-black" style={{ color: appTheme.colors.primary }}>
                      {member.name.slice(0, 1).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="font-semibold" style={{ color: appTheme.colors.foreground }}>
                    {member.name}
                  </Text>
                  <Text numberOfLines={1} className="text-xs" style={{ color: appTheme.colors.muted }}>
                    {member.email ?? "No email"}
                  </Text>
                </View>
                <Text className="text-xs font-bold uppercase" style={{ color: appTheme.colors.primary }}>
                  {member.role}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}
