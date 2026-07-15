import { useMemo } from "react";
import { View, Pressable } from "react-native";
import { AppText as Text } from "@/components/AppText";
import { usePathname, type Href, router } from "expo-router";
import Animated, { useAnimatedStyle, interpolate } from "react-native-reanimated";
import { useDrawerProgress } from "react-native-drawer-layout";
import { GlassBox } from "@/components/GlassBox";
import { Image } from "expo-image";
import type { SFSymbol } from "expo-symbols";
import { AppSymbol } from "@/components/AppSymbol";
import { useAuth } from "@/components/AuthProvider";
import { useAppTheme } from "@/components/AppTheme";
import { useTranslation } from "react-i18next";

export type SidebarSubItem = {
  label: string;
  icon?: SFSymbol;
  route?: Href;
  onPress?: () => void;
  activeRoutes?: string[];
  badge?: string;
};

export type SidebarNavItem = {
  label: string;
  icon?: SFSymbol;
  route?: Href;
  onPress?: () => void;
  subItems?: SidebarSubItem[];
  activeRoutes?: string[];
  badge?: string;
};

export type SidebarGroup = {
  label?: string;
  items: SidebarNavItem[];
};

type SidebarProps = {
  onClose: () => void;
  onOpenProfile: () => void;
  groups?: SidebarGroup[];
};

function isItemActive(pathname: string, item: SidebarNavItem | SidebarSubItem): boolean {
  if (item.activeRoutes) {
    return item.activeRoutes.some((r) => {
      if (r.endsWith("/*")) return pathname.startsWith(r.slice(0, -2));
      return pathname === r;
    });
  }
  if (item.route) {
    const routeStr = typeof item.route === "string" ? item.route : String(item.route);
    return pathname === routeStr || pathname.startsWith(`${routeStr}/`);
  }
  return false;
}

function hasAnyActiveChild(pathname: string, subItems: SidebarSubItem[]): boolean {
  return subItems.some((sub) => isItemActive(pathname, sub));
}

function SidebarNavRow({
  item,
  isActive,
  isSubItem = false,
  onPress,
}: {
  item: SidebarNavItem | SidebarSubItem;
  isActive: boolean;
  isSubItem?: boolean;
  onPress: () => void;
}) {
  const appTheme = useAppTheme();
  const iconSize = isSubItem ? 14 : 16;
  const surface = appTheme.isDark ? "rgba(255,255,255,0.035)" : "rgba(15,23,42,0.028)";
  const separatorLine = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";
  const rowBackground = isActive ? surface : "transparent";

  return (
    <Pressable
      className="overflow-hidden rounded-xl px-2.5 py-2"
      style={[
        {
          backgroundColor: rowBackground,
          borderWidth: isActive ? 1 : 0,
          borderColor: separatorLine,
        },
        isSubItem && { marginLeft: 28, paddingLeft: 8 },
      ]}
      onPress={onPress}
    >
      {isActive ? (
        <View
          className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full"
          style={{ backgroundColor: appTheme.colors.primary }}
        />
      ) : null}
      <View className="flex-row items-center gap-2.5">
        {item.icon ? (
          <View
            className="h-7 w-7 items-center justify-center rounded-full"
            style={{
              backgroundColor: isActive ? "transparent" : surface,
            }}
          >
            <AppSymbol
              name={item.icon}
              size={iconSize}
              tintColor={appTheme.colors.primary}
              fallback={
                <Text
                  style={{ color: isActive ? appTheme.colors.primary : appTheme.colors.foreground, fontSize: iconSize }}
                >
                  •
                </Text>
              }
            />
          </View>
        ) : (
          <View className="h-7 w-7" />
        )}
        <Text
          numberOfLines={1}
          style={{
            color: appTheme.colors.foreground,
            fontSize: isSubItem ? appTheme.textSize - 4 : appTheme.textSize - 3,
            fontWeight: isActive ? "700" : "600",
            letterSpacing: appTheme.textSpacing,
          }}
        >
          {item.label}
        </Text>
        {'badge' in item && item.badge ? (
          <View
            className="ml-auto rounded-full px-2 py-0.5"
            style={{ backgroundColor: appTheme.colors.primary + "22" }}
          >
            <Text
              style={{
                color: appTheme.colors.primary,
                fontSize: appTheme.textSize - 6,
                fontWeight: "700",
                letterSpacing: 0.5,
              }}
            >
              {item.badge}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function Sidebar({ onClose, onOpenProfile, groups: groupsProp }: SidebarProps) {
  const { t } = useTranslation();
  const appTheme = useAppTheme();
  const auth = useAuth();
  const pathname = usePathname();
  const progress = useDrawerProgress();

  const defaultGroups = useMemo<SidebarGroup[]>(() => [
    {
      label: t('sidebar.cashflow'),
      items: [
        { label: t('sidebar.home'), icon: "house.fill" as SFSymbol, route: "/home" as Href },
        {
          label: t('sidebar.wallet'),
          icon: "wallet.pass.fill" as SFSymbol,
          route: "/forms/wallet" as Href,
          subItems: [{ label: t('sidebar.transfer'), icon: "arrow.left.arrow.right" as SFSymbol, route: "/forms/transfer" as Href }],
        },
        { label: t('sidebar.categoriesBudget'), icon: "chart.pie.fill" as SFSymbol, route: "/forms/categories" as Href },
        { label: t('sidebar.quickFill'), icon: "bolt.fill" as SFSymbol, route: "/forms/quick-fill" as Href },
        { label: t('sidebar.catatOtomatis'), icon: "repeat.circle.fill" as SFSymbol, route: "/forms/automatic-entry" as Href },
        { label: t('audit.title'), icon: "checkmark.seal.fill" as SFSymbol, route: "/forms/audit" as Href },
      ],
    },
  ], [t]);
  const groups = groupsProp ?? defaultGroups;
  const separatorLine = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.85, 1]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [-20, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.95, 1]) },
    ],
  }));

  const handlePress = (item: SidebarNavItem | SidebarSubItem) => {
    onClose();
    if (item.onPress) {
      item.onPress();
    } else if (item.route) {
      router.push(item.route);
    }
  };

  return (
    <Animated.View
      style={[
        animatedStyle,
        { flex: 1, padding: 16, paddingTop: 54, backgroundColor: appTheme.colors.background },
      ]}
    >
      <View className="mb-5 flex-row items-center justify-between px-1">
        <Text className="text-xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
          {t('sidebar.menu')}
        </Text>
        <Text className="text-xs font-semibold uppercase tracking-[2px]" style={{ color: appTheme.colors.muted }}>
          Ethos
        </Text>
      </View>

      {groups.map((group, gi) => (
        <View
          key={gi}
          className="rounded-2xl px-1 py-2"
          style={{
            marginBottom: 10,
            borderTopWidth: gi === 0 ? 0 : 1,
            borderColor: separatorLine,
          }}
        >
          {group.label ? (
            <View className="mb-1.5 flex-row items-center justify-between px-2">
              <Text
                className="text-xs font-semibold uppercase tracking-[1.6px]"
                style={{ color: appTheme.colors.muted }}
              >
                {group.label}
              </Text>
              <Text className="text-xs font-bold" style={{ color: appTheme.colors.muted }}>
                {group.items.length}
              </Text>
            </View>
          ) : null}
          <View style={{ gap: 1 }}>
            {group.items.map((item, ii) => {
              const active = isItemActive(pathname, item);
              const childActive = item.subItems ? hasAnyActiveChild(pathname, item.subItems) : false;

              return (
                <View key={ii}>
                  <SidebarNavRow
                    item={item}
                    isActive={active && !childActive}
                    onPress={() => handlePress(item)}
                  />
                  {item.subItems ? (
                    <View>
                      <View
                        style={{
                          position: "absolute",
                          left: 20,
                          top: 0,
                          bottom: 0,
                          width: 2,
                          backgroundColor: appTheme.colors.primary,
                          opacity: 0.25,
                          borderRadius: 1,
                        }}
                      />
                      {item.subItems.map((sub, si) => (
                        <SidebarNavRow
                          key={si}
                          item={sub}
                          isSubItem
                          isActive={isItemActive(pathname, sub)}
                          onPress={() => handlePress(sub)}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      <View className="flex-1" />

      <Pressable
        className="overflow-hidden rounded-3xl"
        onPress={onOpenProfile}
        accessibilityRole="button"
        accessibilityLabel={t('sidebar.openProfile')}
      >
        <GlassBox
          isInteractive
          glassEffectStyle="regular"
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: appTheme.colors.overlay,
            backgroundColor: appTheme.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.62)",
            padding: 12,
          }}
        >
          <View className="flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center overflow-hidden rounded-full"
              style={{ backgroundColor: appTheme.colors.primary }}
            >
              {auth.avatarSource ? (
                <Image source={auth.avatarSource} contentFit="cover" style={{ height: "100%", width: "100%" }} />
              ) : (
                <Text
                  style={{
                    color: appTheme.colors.inverseForeground,
                    fontSize: appTheme.textSize - 1,
                    fontWeight: "800",
                    letterSpacing: appTheme.textSpacing,
                  }}
                >
                  {auth.initials}
                </Text>
              )}
            </View>

            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                style={{ color: appTheme.colors.foreground, fontSize: appTheme.textSize - 1, fontWeight: "700", letterSpacing: appTheme.textSpacing }}
              >
                {auth.displayName}
              </Text>
              <Text numberOfLines={1} style={appTheme.text.caption}>
                {auth.email || (auth.isPending ? t('sidebar.loading') : t('sidebar.notSignedIn'))}
              </Text>
            </View>

            <Text className="text-2xl" style={{ color: appTheme.colors.muted }}>›</Text>
          </View>
        </GlassBox>
      </Pressable>
    </Animated.View>
  );
}
