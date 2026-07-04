import { useState, useEffect, useRef, type ReactNode } from "react";
import { Animated, Modal, Pressable, ScrollView, TextInput as RNTextInput, View, useWindowDimensions } from "react-native";
import { Stack } from "expo-router";
import { AppText as Text } from "@/components/AppText";
import * as Haptics from "expo-haptics";
import SegmentedControl from "@expo/ui/community/segmented-control";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { GlassView } from "expo-glass-effect";
import { useAppTheme } from "@/components/AppTheme";
import { alpha } from "@/lib/color";

const QUICK_FILLS = ["Kopi", "Makan siang", "Parkir", "Grab", "Token listrik"];
const DENOMINATIONS = [
  { value: 1000, color: "#6b7280" },
  { value: 2000, color: "#64748b" },
  { value: 5000, color: "#a16207" },
  { value: 10000, color: "#9333ea" },
  { value: 50000, color: "#2563eb" },
  { value: 100000, color: "#dc2626" },
];
const DATE_OPTIONS = [
  { label: "Hari ini", daysAgo: 0 },
  { label: "Kemaren", daysAgo: 1 },
  { label: "Tanggal" },
];
const CATEGORIES = [
  { name: "Makanan", symbol: "fork.knife" as SFSymbol, color: "#ca8a04" },
  { name: "Transport", symbol: "car.fill" as SFSymbol, color: "#ea580c" },
  { name: "Belanja", symbol: "basket.fill" as SFSymbol, color: "#dc2626" },
  { name: "Tagihan", symbol: "bolt.fill" as SFSymbol, color: "#2563eb" },
];

const INITIAL_CATEGORY_INDEX = Math.floor((CATEGORIES.length - 1) / 2);
const LOOPED_CATEGORIES = [...CATEGORIES, ...CATEGORIES, ...CATEGORIES];
const LOOP_START_INDEX = CATEGORIES.length;
const LOOP_END_INDEX = LOOP_START_INDEX + CATEGORIES.length - 1;
const INITIAL_LOOP_INDEX = LOOP_START_INDEX + INITIAL_CATEGORY_INDEX;
const CATEGORY_CHIP_WIDTH = 94;
const CATEGORY_CHIP_GAP = 8;
const CATEGORY_CHIP_SNAP = CATEGORY_CHIP_WIDTH + CATEGORY_CHIP_GAP;
const CATEGORY_SNAP_OFFSETS = LOOPED_CATEGORIES.map((_, index) => index * CATEGORY_CHIP_SNAP);
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function FormSymbol({ name, color, size = 16 }: { name: SFSymbol; color: string; size?: number }) {
  return <SymbolView name={name} size={size} tintColor={color} fallback={<Text style={{ color }}>•</Text>} />;
}

function formatShortAmount(amount: number) {
  return amount >= 1000 ? `${amount / 1000}k` : `${amount}`;
}

function formatAmountDigits(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function getCategoryIndexFromOffset(offsetX: number, snapWidth: number, maxIndex = CATEGORIES.length - 1) {
  return Math.min(Math.max(Math.round(offsetX / snapWidth), 0), maxIndex);
}

function getDateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function formatCompactDate(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function QuickAmountStrip({ onAmount }: { onAmount: (value: number) => void }) {
  const appTheme = useAppTheme();
  const neutralBg = appTheme.isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.78)";
  const neutralBorder = appTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)";

  return (
    <View className="w-full overflow-hidden rounded-2xl border" style={{ backgroundColor: neutralBg, borderColor: neutralBorder }}>
      <View className="flex-row">
        {DENOMINATIONS.map((item, index) => (
          <View key={item.value} className="flex-1 flex-row">
            <Pressable accessibilityRole="button" className="min-h-10 flex-1 items-center justify-center px-1" onPress={() => onAmount(item.value)}>
              <Text className="text-sm font-semibold" style={{ color: item.color }}>
                +{formatShortAmount(item.value)}
              </Text>
            </Pressable>
            {index < DENOMINATIONS.length - 1 ? <View className="w-px" style={{ backgroundColor: neutralBorder }} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function QuickFillChip({ label }: { label: string }) {
  const appTheme = useAppTheme();
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";

  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-9 flex-row items-center gap-1.5 rounded-full border px-3"
      style={{
        backgroundColor: appTheme.isDark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.45)",
        borderColor,
      }}
    >
      <FormSymbol name="plus" color={appTheme.colors.muted} size={11} />
      <Text className="text-sm font-medium" style={{ color: appTheme.colors.foreground }}>
        {label}
      </Text>
    </Pressable>
  );
}

function DateChoice({ label, subtitle, selected, onPress }: { label: string; subtitle: ReactNode; selected: boolean; onPress: () => void }) {
  const appTheme = useAppTheme();
  const borderColor = selected ? alpha(appTheme.colors.primary, 0.45) : (appTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)");

  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-14 flex-1 items-center justify-center gap-1 rounded-2xl border px-2 mb-10 py-2"
      onPress={onPress}
      style={{
        backgroundColor: selected ? alpha(appTheme.colors.primary, appTheme.isDark ? 0.2 : 0.12) : (appTheme.isDark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.45)"),
        borderColor,
      }}
    >
      <View className="flex-row items-center gap-1.5">
        <FormSymbol name="calendar" color={selected ? appTheme.colors.primary : appTheme.colors.muted} size={14} />
        <Text className="text-sm font-semibold" style={{ color: selected ? appTheme.colors.primary : appTheme.colors.foreground }}>
          {label}
        </Text>
      </View>
      <View className="min-h-5 items-center justify-center">{subtitle}</View>
    </Pressable>
  );
}

function Section({ title, overflowVisible, borderless, children }: { title?: string; overflowVisible?: boolean; borderless?: boolean; children: ReactNode }) {
  const appTheme = useAppTheme();

  return (
    <View className="gap-2" style={{ overflow: overflowVisible ? "visible" : "hidden" }}>
      {title ? (
        <Text className="px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: appTheme.colors.muted }}>
          {title}
        </Text>
      ) : null}
      <View
        className={borderless ? "" : "rounded-3xl border"}
        style={{
          backgroundColor: borderless ? "transparent" : (appTheme.isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.78)"),
          borderColor: borderless ? "transparent" : (appTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)"),
          overflow: overflowVisible ? "visible" : "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function EntryForm() {
  const appTheme = useAppTheme();
  const [ioIndex, setIoIndex] = useState(1);
  const [dateIndex, setDateIndex] = useState(0);
  const [categoryIndex, setCategoryIndex] = useState(INITIAL_CATEGORY_INDEX);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [amountText, setAmountText] = useState("");
  const [noteText, setNoteText] = useState("");
  const controlFill = appTheme.isDark ? "rgba(255,255,255,0.075)" : "rgba(15,23,42,0.045)";
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const carouselW = Math.max(screenWidth - 32, CATEGORY_CHIP_WIDTH);
  const sidePad = carouselW / 2 - CATEGORY_CHIP_WIDTH / 2;
  const scrollX = useRef(new Animated.Value(INITIAL_LOOP_INDEX * CATEGORY_CHIP_SNAP)).current;
  const lastSnappedRef = useRef(INITIAL_LOOP_INDEX);
  const categoryIndexRef = useRef(INITIAL_CATEGORY_INDEX);

  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      const nextLoopIndex = getCategoryIndexFromOffset(value, CATEGORY_CHIP_SNAP, LOOPED_CATEGORIES.length - 1);
      if (nextLoopIndex === lastSnappedRef.current) {
        return;
      }

      const nextIndex = nextLoopIndex % CATEGORIES.length;

      lastSnappedRef.current = nextLoopIndex;
      if (nextIndex !== categoryIndexRef.current) {
        categoryIndexRef.current = nextIndex;
        setCategoryIndex(nextIndex);
        Haptics.selectionAsync().catch(() => {});
      }
    });
    return () => scrollX.removeListener(id);
  }, [scrollX]);

  const settleCategory = (offsetX: number, animated = false) => {
    let nextLoopIndex = getCategoryIndexFromOffset(offsetX, CATEGORY_CHIP_SNAP, LOOPED_CATEGORIES.length - 1);
    const nextIndex = nextLoopIndex % CATEGORIES.length;

    if (nextLoopIndex < LOOP_START_INDEX || nextLoopIndex > LOOP_END_INDEX) {
      nextLoopIndex = LOOP_START_INDEX + nextIndex;
      lastSnappedRef.current = nextLoopIndex;
      if (nextIndex !== categoryIndexRef.current) {
        categoryIndexRef.current = nextIndex;
        setCategoryIndex(nextIndex);
      }
      scrollRef.current?.scrollTo({ x: nextLoopIndex * CATEGORY_CHIP_SNAP, animated: false });
      return;
    }

    lastSnappedRef.current = nextLoopIndex;
    if (nextIndex !== categoryIndexRef.current) {
      categoryIndexRef.current = nextIndex;
      setCategoryIndex(nextIndex);
    }

    const nextOffsetX = nextLoopIndex * CATEGORY_CHIP_SNAP;
    if (animated || Math.abs(offsetX - nextOffsetX) > 0.5) {
      scrollRef.current?.scrollTo({ x: nextOffsetX, animated });
    }
  };

  const addQuickAmount = (value: number) => {
    setAmountText((prev) => String((parseInt(prev, 10) || 0) + value));
  };

  const clearForm = () => {
    setDateIndex(0);
    setCustomDate(null);
    setAmountText("");
    setNoteText("");
    lastSnappedRef.current = INITIAL_LOOP_INDEX;
    categoryIndexRef.current = INITIAL_CATEGORY_INDEX;
    setCategoryIndex(INITIAL_CATEGORY_INDEX);
    scrollRef.current?.scrollTo({ x: INITIAL_LOOP_INDEX * CATEGORY_CHIP_SNAP, animated: true });
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: INITIAL_LOOP_INDEX * CATEGORY_CHIP_SNAP, animated: false });
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: "Entry" }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.View hidesSharedBackground>
          <SegmentedControl
            values={["Income", "Expense"]}
            selectedIndex={ioIndex}
            onChange={(event) => setIoIndex(event.nativeEvent.selectedSegmentIndex)}
            tintColor={appTheme.colors.primary}
            appearance={appTheme.isDark ? "dark" : "light"}
            style={{ width: 180 }}
          />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="eraser" onPress={clearForm} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.View hidesSharedBackground>
          <GlassView
            isInteractive
            tintColor={alpha(appTheme.colors.primary, appTheme.isDark ? 0.35 : 0.18)}
            glassEffectStyle="clear"
            style={{
              borderRadius: 9999,
              height: 50,
              width: Math.max(160, screenWidth - 112),
            }}
          >
            {noteText.length === 0 ? (
              <View pointerEvents="none" className="absolute inset-0 justify-center px-3.5">
                <Text className="text-base" style={{ color: appTheme.colors.muted }}>
                  Spending apa hari ini?
                </Text>
              </View>
            ) : null}
            <RNTextInput
              value={noteText}
              onChangeText={setNoteText}
              selectionColor={appTheme.colors.primary}
              style={{
                color: appTheme.colors.foreground,
                fontSize: 16,
                height: 50,
                includeFontPadding: false,
                paddingHorizontal: 14,
                paddingVertical: 0,
                textAlignVertical: "center",
              }}
            />
          </GlassView>
        </Stack.Toolbar.View>
        <Stack.Toolbar.Button icon="checkmark" onPress={() => {}} variant="done">
          Simpan
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <ScrollView
        className="bg-[--app-color-background] flex-1"
        contentContainerClassName="gap-4 px-4 pb-20 pt-4"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-2 pb-1">
          <View className="h-28 w-full items-center justify-center">
            <RNTextInput
              className="w-full text-7xl font-bold tracking-tight"
              inputMode="numeric"
              keyboardType="number-pad"
              placeholder="Rp 0"
              placeholderTextColor={appTheme.colors.muted}
              style={{ color: appTheme.colors.foreground, height: 96, includeFontPadding: false, lineHeight: 84, paddingVertical: 0, textAlign: "center", textAlignVertical: "center", transform: [{ translateY: -4 }] }}
              value={amountText ? `Rp ${formatAmountDigits(amountText)}` : ""}
              onChangeText={(text) => setAmountText(text.replace(/\D/g, ""))}
            />
          </View>
        </View>

        <Section overflowVisible borderless>
          <View className="gap-3 px-4 pt-3 pb-3">
            <QuickAmountStrip onAmount={addQuickAmount} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ overflow: "visible" }} contentContainerStyle={{ gap: 8 }}>
              {QUICK_FILLS.map((label) => (
                <QuickFillChip key={label} label={label} />
              ))}
            </ScrollView>
          </View>
          <View className="h-px" style={{ backgroundColor: appTheme.isDark ? "rgba(255,255,255,0.09)" : "rgba(15,23,42,0.08)" }} />
          <View className="py-4" style={{ overflow: "visible" }}>
            <Animated.ScrollView
              ref={scrollRef}
              horizontal
              bounces={false}
              disableIntervalMomentum
              overScrollMode="never"
              removeClippedSubviews={false}
              showsHorizontalScrollIndicator={false}
              snapToOffsets={CATEGORY_SNAP_OFFSETS}
              decelerationRate="fast"
              scrollEventThrottle={16}
              style={{ overflow: "visible" }}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
              onMomentumScrollEnd={(e) => {
                settleCategory(e.nativeEvent.contentOffset.x);
              }}
              onScrollEndDrag={(e) => {
                if (Math.abs(e.nativeEvent.velocity?.x ?? 0) < 0.1) {
                  settleCategory(e.nativeEvent.contentOffset.x, true);
                }
              }}
              contentContainerStyle={{ paddingHorizontal: sidePad }}
            >
              {LOOPED_CATEGORIES.map((item, index) => {
                const realIndex = index % CATEGORIES.length;
                const sel = categoryIndex === realIndex;
                const inputRange = [(index - 1) * CATEGORY_CHIP_SNAP, index * CATEGORY_CHIP_SNAP, (index + 1) * CATEGORY_CHIP_SNAP];
                const scale = scrollX.interpolate({ inputRange, outputRange: [0.9, 1.08, 0.9], extrapolate: "clamp" });
                const translateY = scrollX.interpolate({ inputRange, outputRange: [5, -2, 5], extrapolate: "clamp" });
                const opacity = scrollX.interpolate({ inputRange, outputRange: [0.68, 1, 0.68], extrapolate: "clamp" });

                return (
                  <Animated.View key={`${item.name}-${index}`} style={{ marginRight: index === LOOPED_CATEGORIES.length - 1 ? 0 : CATEGORY_CHIP_GAP, opacity, transform: [{ translateY }, { scale }] }}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        const targetIndex = LOOP_START_INDEX + realIndex;
                        lastSnappedRef.current = targetIndex;
                        if (realIndex !== categoryIndexRef.current) {
                          categoryIndexRef.current = realIndex;
                          setCategoryIndex(realIndex);
                        }
                        scrollRef.current?.scrollTo({ x: targetIndex * CATEGORY_CHIP_SNAP, animated: true });
                      }}
                      className="items-center justify-center rounded-2xl"
                      style={{
                        width: CATEGORY_CHIP_WIDTH,
                        paddingVertical: 13,
                        backgroundColor: sel ? item.color : alpha(item.color, appTheme.isDark ? 0.14 : 0.09),
                      }}
                    >
                      <FormSymbol name={item.symbol} color={sel ? "#fff" : item.color} size={20} />
                      <Text className="mt-1 text-xs font-medium" style={{ color: sel ? "#fff" : item.color }}>
                        {item.name}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </Animated.ScrollView>
            <View className="flex-row justify-center gap-1.5 pt-2">
              {CATEGORIES.map((item, index) => (
                <View
                  key={item.name}
                  className="rounded-full"
                  style={{
                    width: categoryIndex === index ? 20 : 6,
                    height: 6,
                    backgroundColor: categoryIndex === index ? item.color : appTheme.colors.muted,
                    opacity: categoryIndex === index ? 1 : 0.35,
                  }}
                />
              ))}
            </View>
          </View>
        </Section>

        <View className="flex-row gap-2">
          {DATE_OPTIONS.map((option, index) => (
            <DateChoice
              key={option.label}
              label={option.label}
              subtitle={option.daysAgo !== undefined ? (
                <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
                  {formatCompactDate(getDateDaysAgo(option.daysAgo))}
                </Text>
              ) : (
                <Text className="text-xs" style={{ color: appTheme.colors.muted }}>
                  {customDate ? formatCompactDate(customDate) : "Tap to pick"}
                </Text>
              )}
              selected={dateIndex === index}
              onPress={() => {
                if (dateIndex !== index) {
                  Haptics.selectionAsync().catch(() => {});
                }
                setDateIndex(index);
                if (option.daysAgo === undefined) {
                  setShowDatePicker(true);
                }
              }}
            />
          ))}
        </View>

      </ScrollView>
      {showDatePicker && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
          <Pressable className="flex-1 justify-end px-4 pb-8" style={{ backgroundColor: "rgba(0,0,0,0.35)" }} onPress={() => setShowDatePicker(false)}>
            <Pressable
              className="rounded-3xl border p-4"
              style={{
                backgroundColor: appTheme.colors.background,
                borderColor: appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)",
              }}
            >
              <DateTimePicker
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
      )}
    </>
  );
}
