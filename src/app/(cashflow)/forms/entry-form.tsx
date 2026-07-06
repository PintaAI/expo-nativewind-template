import { useState, useEffect, useMemo, useRef, useCallback, type ReactNode } from "react";
import { Alert, Animated, Modal, Platform, Pressable, ScrollView, TextInput as RNTextInput, View, useWindowDimensions } from "react-native";
import { router, Stack, useLocalSearchParams, type Href } from "expo-router";
import { AppText as Text } from "@/components/AppText";
import * as Haptics from "expo-haptics";
import SegmentedControl from "@expo/ui/community/segmented-control";
import DateTimePicker from "@expo/ui/community/datetime-picker";
import { SymbolView, type SFSymbol } from "expo-symbols";
import { GlassView } from "expo-glass-effect";
import { useAppTheme } from "@/components/AppTheme";
import { useCurrency } from "@/components/CurrencyProvider";
import { useCashflowData } from "@/data/cashflow/CashflowDataProvider";
import { alpha } from "@/lib/color";
import { toDateKey, parseDateKey } from "@/lib/date";
import { getPreference, setPreference } from "@/lib/preferences";

const QUICK_FILLS = ["Kopi", "Makan siang", "Parkir", "Grab", "Token listrik"];
const DENOMINATION_COLORS = ["#6b7280", "#64748b", "#a16207", "#9333ea", "#2563eb", "#dc2626", "#16a34a"];
const DATE_OPTIONS = [
  { label: "Kemaren", daysAgo: 1 },
  { label: "Hari ini", daysAgo: 0 },
  { label: "Tanggal" },
];
const FALLBACK_CATEGORIES = [
  { id: null, name: "Makanan", symbol: "fork.knife" as SFSymbol, color: "#ca8a04" },
  { id: null, name: "Transport", symbol: "car.fill" as SFSymbol, color: "#ea580c" },
  { id: null, name: "Belanja", symbol: "basket.fill" as SFSymbol, color: "#dc2626" },
  { id: null, name: "Tagihan", symbol: "bolt.fill" as SFSymbol, color: "#2563eb" },
];

const CATEGORY_CHIP_WIDTH = 94;
const CATEGORY_CHIP_GAP = 8;
const CATEGORY_CHIP_SNAP = CATEGORY_CHIP_WIDTH + CATEGORY_CHIP_GAP;
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

type WheelPickerFeedbackModule = {
  triggerSoundAndImpact: () => void;
};

let wheelPickerFeedbackModule: WheelPickerFeedbackModule | null = null;
let wheelPickerFeedbackLoadPromise: Promise<void> | null = null;

function loadNativeWheelPickerFeedback() {
  if (Platform.OS !== "ios" || wheelPickerFeedbackLoadPromise) return;

  wheelPickerFeedbackLoadPromise = import("@quidone/react-native-wheel-picker-feedback")
    .then((module) => {
      wheelPickerFeedbackModule = module.default;
    })
    .catch(() => {
      wheelPickerFeedbackModule = null;
    });
}

function triggerNativeWheelPickerFeedback() {
  if (Platform.OS !== "ios") return false;
  if (!wheelPickerFeedbackModule) loadNativeWheelPickerFeedback();

  if (!wheelPickerFeedbackModule) return false;
  wheelPickerFeedbackModule.triggerSoundAndImpact();
  return true;
}

function FormSymbol({ name, color, size = 16 }: { name: SFSymbol; color: string; size?: number }) {
  return <SymbolView name={name} size={size} tintColor={color} fallback={<Text style={{ color }}>•</Text>} />;
}

function formatShortAmount(amount: number) {
  return amount >= 1000 ? `${amount / 1000}k` : `${amount}`;
}

function formatAmountDigits(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function getCategoryIndexFromOffset(offsetX: number, snapWidth: number, maxIndex: number) {
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

function QuickAmountStrip({ denominations, onAmount }: { denominations: number[]; onAmount: (value: number) => void }) {
  const appTheme = useAppTheme();
  const neutralBg = appTheme.isDark ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.78)";
  const neutralBorder = appTheme.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)";

  return (
    <View className="w-full overflow-hidden rounded-2xl border" style={{ backgroundColor: neutralBg, borderColor: neutralBorder }}>
      <View className="flex-row">
        {denominations.map((value, index) => (
          <View key={value} className="flex-1 flex-row">
            <Pressable accessibilityRole="button" className="min-h-10 flex-1 items-center justify-center px-1" onPress={() => onAmount(value)}>
              <Text className="text-sm font-semibold" style={{ color: DENOMINATION_COLORS[index % DENOMINATION_COLORS.length] }}>
                +{formatShortAmount(value)}
              </Text>
            </Pressable>
            {index < denominations.length - 1 ? <View className="w-px" style={{ backgroundColor: neutralBorder }} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function QuickFillChip({ label, onPress }: { label: string; onPress: () => void }) {
  const appTheme = useAppTheme();
  const borderColor = appTheme.isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.1)";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
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
  const currency = useCurrency();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { categories, quickFills, entries, createEntry, updateEntry } = useCashflowData();
  const editingEntry = useMemo(
    () => (id ? entries.find((e) => e.id === id) ?? null : null),
    [id, entries],
  );
  const categoryOptions = useMemo(
    () => categories.length > 0
      ? categories.map((category) => ({
          id: category.id,
          name: category.name,
          symbol: (category.icon ?? "tag.fill") as SFSymbol,
          color: category.color ?? appTheme.colors.primary,
        }))
      : FALLBACK_CATEGORIES,
    [appTheme.colors.primary, categories],
  );
  const initialCategoryIndex = Math.floor((categoryOptions.length - 1) / 2);
  const addCategoryIndex = categoryOptions.length;
  const categorySnapOffsets = [...categoryOptions.map((_, index) => index * CATEGORY_CHIP_SNAP), addCategoryIndex * CATEGORY_CHIP_SNAP];
  const [ioIndex, setIoIndex] = useState(1);
  const [dateIndex, setDateIndex] = useState(0);
  const [categoryIndex, setCategoryIndex] = useState(initialCategoryIndex);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [amountText, setAmountText] = useState("");
  const [initialAmountText, setInitialAmountText] = useState("");
  const [noteText, setNoteText] = useState("");
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const carouselW = Math.max(screenWidth - 32, CATEGORY_CHIP_WIDTH);
  const sidePad = carouselW / 2 - CATEGORY_CHIP_WIDTH / 2;
  const [scrollX] = useState(() => new Animated.Value(initialCategoryIndex * CATEGORY_CHIP_SNAP));
  const lastSnappedRef = useRef(initialCategoryIndex);
  const categoryIndexRef = useRef(initialCategoryIndex);

  const selectCategory = (nextIndex: number, animated = true) => {
    if (nextIndex < 0 || nextIndex >= categoryOptions.length) return;

    lastSnappedRef.current = nextIndex;
    categoryIndexRef.current = nextIndex;
    setCategoryIndex(nextIndex);
    setPreference("cashflowCategoryIndex", nextIndex).catch(() => {});
    scrollRef.current?.scrollTo({ x: nextIndex * CATEGORY_CHIP_SNAP, animated });
  };

  const playFeedback = useCallback((feedback: "impact" | "selection" = "impact") => {
    if (triggerNativeWheelPickerFeedback()) return;

    const haptic = feedback === "selection"
      ? Haptics.selectionAsync()
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);

    haptic.catch(() => {});
  }, []);

  useEffect(() => {
    loadNativeWheelPickerFeedback();
  }, []);

  useEffect(() => {
    if (!editingEntry || categoryOptions.length === 0) return;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      const displayNominal = editingEntry.originalCurrency === currency.currency && editingEntry.originalNominal !== null
        ? editingEntry.originalNominal
        : currency.toDisplay(editingEntry.nominal);
      const nextAmountText = String(Math.round(displayNominal));

      setIoIndex(editingEntry.io === "Income" ? 0 : 1);
      setAmountText(nextAmountText);
      setInitialAmountText(nextAmountText);
      setNoteText(editingEntry.name);

      if (editingEntry.date === toDateKey(getDateDaysAgo(0))) {
        setDateIndex(0);
        setCustomDate(null);
      } else if (editingEntry.date === toDateKey(getDateDaysAgo(1))) {
        setDateIndex(1);
        setCustomDate(null);
      } else {
        setDateIndex(2);
        setCustomDate(parseDateKey(editingEntry.date));
      }

      if (editingEntry.category) {
        const normalizedCategory = editingEntry.category.trim().toLowerCase();
        const idx = categoryOptions.findIndex((c) => c.name.trim().toLowerCase() === normalizedCategory);
        if (idx >= 0) {
          const nextOffset = idx * CATEGORY_CHIP_SNAP;
          categoryIndexRef.current = idx;
          lastSnappedRef.current = idx;
          setCategoryIndex(idx);
          scrollX.setValue(nextOffset);
          requestAnimationFrame(() => {
            scrollRef.current?.scrollTo({ x: nextOffset, animated: false });
          });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currency, editingEntry, categoryOptions, scrollX]);

  useEffect(() => {
    const id = scrollX.addListener(({ value }) => {
      const nextIndex = getCategoryIndexFromOffset(value, CATEGORY_CHIP_SNAP, addCategoryIndex);
      if (nextIndex === lastSnappedRef.current) {
        return;
      }

      lastSnappedRef.current = nextIndex;
      if (nextIndex < categoryOptions.length && nextIndex !== categoryIndexRef.current) {
        categoryIndexRef.current = nextIndex;
        setCategoryIndex(nextIndex);
      }
      playFeedback("selection");
    });
    return () => scrollX.removeListener(id);
  }, [addCategoryIndex, categoryOptions.length, playFeedback, scrollX]);

  const settleCategory = (offsetX: number, animated = false) => {
    const nextIndex = getCategoryIndexFromOffset(offsetX, CATEGORY_CHIP_SNAP, addCategoryIndex);

    lastSnappedRef.current = nextIndex;
    if (nextIndex < categoryOptions.length && nextIndex !== categoryIndexRef.current) {
      categoryIndexRef.current = nextIndex;
      setCategoryIndex(nextIndex);
      setPreference("cashflowCategoryIndex", nextIndex).catch(() => {});
    }

    const nextOffsetX = nextIndex * CATEGORY_CHIP_SNAP;
    if (animated || Math.abs(offsetX - nextOffsetX) > 0.5) {
      scrollRef.current?.scrollTo({ x: nextOffsetX, animated });
    }
  };

  const addQuickAmount = (value: number) => {
    setAmountText((prev) => String((parseInt(prev, 10) || 0) + value));
  };

  const clearForm = () => {
    if (editingEntry) {
      const displayNominal = editingEntry.originalCurrency === currency.currency && editingEntry.originalNominal !== null
        ? editingEntry.originalNominal
        : currency.toDisplay(editingEntry.nominal);
      const nextAmountText = String(Math.round(displayNominal));

      setIoIndex(editingEntry.io === "Income" ? 0 : 1);
      setAmountText(nextAmountText);
      setInitialAmountText(nextAmountText);
      setNoteText(editingEntry.name);

      if (editingEntry.date === toDateKey(getDateDaysAgo(0))) {
        setDateIndex(0);
        setCustomDate(null);
      } else if (editingEntry.date === toDateKey(getDateDaysAgo(1))) {
        setDateIndex(1);
        setCustomDate(null);
      } else {
        setDateIndex(2);
        setCustomDate(parseDateKey(editingEntry.date));
      }

      if (editingEntry.category) {
        const idx = categoryOptions.findIndex((c) => c.name === editingEntry.category);
        if (idx >= 0) {
          const nextOffset = idx * CATEGORY_CHIP_SNAP;
          categoryIndexRef.current = idx;
          lastSnappedRef.current = idx;
          setCategoryIndex(idx);
          scrollX.setValue(nextOffset);
          scrollRef.current?.scrollTo({ x: nextOffset, animated: true });
        }
      }
      return;
    }

    setDateIndex(0);
    setCustomDate(null);
    setAmountText("");
    setInitialAmountText("");
    setNoteText("");
    lastSnappedRef.current = initialCategoryIndex;
    categoryIndexRef.current = initialCategoryIndex;
    setCategoryIndex(initialCategoryIndex);
    scrollRef.current?.scrollTo({ x: initialCategoryIndex * CATEGORY_CHIP_SNAP, animated: true });
  };

  const handleSave = async () => {
    const displayNominal = parseInt(amountText, 10) || 0;
    if (displayNominal <= 0) {
      Alert.alert("Amount required", "Enter an amount before saving this entry.");
      return;
    }

    const nominal = Math.round(currency.toIdr(displayNominal));
    const exchangeRateToIdr = currency.isIdr ? 1 : 1 / currency.rate;

    const selectedCategory = categoryOptions[categoryIndex] ?? categoryOptions[0];
    const selectedDateOption = DATE_OPTIONS[dateIndex];
    const entryDate = selectedDateOption?.daysAgo !== undefined
      ? toDateKey(getDateDaysAgo(selectedDateOption.daysAgo))
      : toDateKey(customDate ?? new Date());

    const io: "Income" | "Expenses" = ioIndex === 0 ? "Income" : "Expenses";
    const payload = {
      name: noteText.trim() || selectedCategory.name,
      nominal,
      categoryId: selectedCategory.id,
      date: entryDate,
      io,
    };

    if (isEditing && id) {
      if (amountText !== initialAmountText) {
        Object.assign(payload, {
          originalNominal: displayNominal,
          originalCurrency: currency.currency,
          exchangeRateToIdr,
          exchangeRateAt: new Date().toISOString(),
        });
      }
      await updateEntry(id, payload);
    } else {
      await createEntry({
        ...payload,
        originalNominal: displayNominal,
        originalCurrency: currency.currency,
        exchangeRateToIdr,
        exchangeRateAt: new Date().toISOString(),
      });
    }

    clearForm();
    router.back();
  };

  useEffect(() => {
    if (isEditing) return;

    let cancelled = false;
    let frame: ReturnType<typeof requestAnimationFrame> | null = null;

    getPreference("cashflowCategoryIndex").then((savedIndex) => {
      if (cancelled) return;

      const nextIndex = savedIndex === null
        ? initialCategoryIndex
        : Math.min(Math.max(savedIndex, 0), categoryOptions.length - 1);

      frame = requestAnimationFrame(() => {
        if (cancelled) return;

        const nextOffset = nextIndex * CATEGORY_CHIP_SNAP;
        lastSnappedRef.current = nextIndex;
        categoryIndexRef.current = nextIndex;
        setCategoryIndex(nextIndex);
        scrollX.setValue(nextOffset);
        scrollRef.current?.scrollTo({ x: nextOffset, animated: false });
      });
    });

    return () => {
      cancelled = true;
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [categoryOptions.length, initialCategoryIndex, isEditing, scrollX]);

  return (
    <>
      <Stack.Screen options={{ title: isEditing ? "Edit" : "" }} />
      <Stack.Toolbar placement="left">
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
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="eraser" onPress={clearForm} />
        <Stack.Toolbar.Button icon="checkmark" onPress={handleSave} variant="done">
          Simpan
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.View hidesSharedBackground>
          <GlassView
            isInteractive
            tintColor={alpha(appTheme.colors.primary, appTheme.isDark ? 0.35 : 0.18)}
            glassEffectStyle="clear"
              style={{
                borderRadius: 9999,
                height: 40,
                width: Math.max(220, screenWidth - 32),
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
                height: 40,
                includeFontPadding: false,
                paddingHorizontal: 14,
                paddingVertical: 0,
                textAlignVertical: "center",
              }}
            />
          </GlassView>
        </Stack.Toolbar.View>
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
              placeholder={`${currency.option.symbol} 0`}
              placeholderTextColor={appTheme.colors.muted}
              style={{ color: appTheme.colors.foreground, height: 96, includeFontPadding: false, lineHeight: 84, paddingVertical: 0, textAlign: "center", textAlignVertical: "center", transform: [{ translateY: -4 }] }}
              value={amountText ? `${currency.option.symbol} ${formatAmountDigits(amountText)}` : ""}
              onChangeText={(text) => setAmountText(text.replace(/\D/g, ""))}
            />
          </View>
          {noteText.trim() ? (
            <Text className="text-base font-medium" style={{ color: appTheme.colors.muted }}>
              {noteText.trim()}
            </Text>
          ) : null}
        </View>

        <Section overflowVisible borderless>
          <View className="gap-3 px-4 pt-3 pb-3">
            <QuickAmountStrip denominations={currency.denominations} onAmount={addQuickAmount} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ overflow: "visible" }} contentContainerStyle={{ gap: 8 }}>
              {(quickFills.length > 0 ? quickFills : QUICK_FILLS.map((label) => ({ id: label, label, amount: null, categoryId: null }))).map((quickFill) => (
                <QuickFillChip
                  key={quickFill.id}
                  label={quickFill.label}
                  onPress={() => {
                    if (quickFill.amount) setAmountText(String(Math.round(currency.toDisplay(quickFill.amount))));
                    setNoteText(quickFill.label);
                    const nextCategoryIndex = categoryOptions.findIndex((category) => category.id === quickFill.categoryId);
                    if (nextCategoryIndex >= 0) selectCategory(nextCategoryIndex);
                  }}
                />
              ))}
              <QuickFillChip label="Tambah" onPress={() => router.push("/forms/quick-fill" as Href)} />
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
              snapToOffsets={categorySnapOffsets}
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
              {categoryOptions.map((item, index) => {
                const sel = categoryIndex === index;
                const inputRange = [(index - 1) * CATEGORY_CHIP_SNAP, index * CATEGORY_CHIP_SNAP, (index + 1) * CATEGORY_CHIP_SNAP];
                const scale = scrollX.interpolate({ inputRange, outputRange: [0.9, 1.08, 0.9], extrapolate: "clamp" });
                const translateY = scrollX.interpolate({ inputRange, outputRange: [5, -2, 5], extrapolate: "clamp" });
                const opacity = scrollX.interpolate({ inputRange, outputRange: [0.68, 1, 0.68], extrapolate: "clamp" });

                return (
                  <Animated.View key={item.name} style={{ marginRight: CATEGORY_CHIP_GAP, opacity, transform: [{ translateY }, { scale }] }}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        playFeedback();
                        scrollRef.current?.scrollTo({ x: index * CATEGORY_CHIP_SNAP, animated: true });
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
              <Animated.View
                style={{
                  opacity: scrollX.interpolate({
                    inputRange: [(addCategoryIndex - 1) * CATEGORY_CHIP_SNAP, addCategoryIndex * CATEGORY_CHIP_SNAP, (addCategoryIndex + 1) * CATEGORY_CHIP_SNAP],
                    outputRange: [0.68, 1, 0.68],
                    extrapolate: "clamp",
                  }),
                  transform: [
                    {
                      translateY: scrollX.interpolate({
                        inputRange: [(addCategoryIndex - 1) * CATEGORY_CHIP_SNAP, addCategoryIndex * CATEGORY_CHIP_SNAP, (addCategoryIndex + 1) * CATEGORY_CHIP_SNAP],
                        outputRange: [5, -2, 5],
                        extrapolate: "clamp",
                      }),
                    },
                    {
                      scale: scrollX.interpolate({
                        inputRange: [(addCategoryIndex - 1) * CATEGORY_CHIP_SNAP, addCategoryIndex * CATEGORY_CHIP_SNAP, (addCategoryIndex + 1) * CATEGORY_CHIP_SNAP],
                        outputRange: [0.9, 1.08, 0.9],
                        extrapolate: "clamp",
                      }),
                    },
                  ],
                  width: CATEGORY_CHIP_WIDTH,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    playFeedback();
                    scrollRef.current?.scrollTo({ x: addCategoryIndex * CATEGORY_CHIP_SNAP, animated: true });
                    router.push("/forms/categories" as Href);
                  }}
                  className="items-center justify-center rounded-2xl border border-dashed"
                  style={{
                    width: CATEGORY_CHIP_WIDTH,
                    paddingVertical: 13,
                    borderColor: alpha(appTheme.colors.primary, 0.45),
                    backgroundColor: alpha(appTheme.colors.primary, appTheme.isDark ? 0.13 : 0.08),
                  }}
                >
                  <FormSymbol name="plus" color={appTheme.colors.primary} size={20} />
                  <Text className="mt-1 text-xs font-semibold" style={{ color: appTheme.colors.primary }}>
                    Kategori
                  </Text>
                </Pressable>
              </Animated.View>
            </Animated.ScrollView>
            <View className="flex-row justify-center gap-1.5 pt-2">
              {categoryOptions.map((item, index) => (
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
                  playFeedback("selection");
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
