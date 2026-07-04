import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Stack, router } from "expo-router";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { alpha } from "@/lib/color";
import { colorsToThemeSet, extractPalette, type ExtractedColors } from "@/lib/palette";

const swatchLabels: (keyof ExtractedColors)[] = ["primary", "secondary", "muted", "background", "foreground"];

export default function Home() {
  const appTheme = useAppTheme();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [themeName, setThemeName] = useState("");
  const [extractedColors, setExtractedColors] = useState<ExtractedColors | null>(null);
  const [debugColors, setDebugColors] = useState<Record<string, string>>({});
  const [debugPlatform, setDebugPlatform] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Ethos needs photo library access to extract image colors.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });

    if (result.canceled) return;

    setImageUri(result.assets[0].uri);
    setExtractedColors(null);
    setDebugColors({});
    setDebugPlatform(null);
    setStatus(null);
  };

  const handleExtractPalette = async () => {
    if (!imageUri) return;

    setIsExtracting(true);
    setStatus(null);

    try {
      const palette = await extractPalette(imageUri);
      setExtractedColors(palette.colors);
      setDebugColors(palette.debugColors);
      setDebugPlatform(palette.platform);
      setStatus("Palette extracted. Name it, then save as a theme.");
    } catch {
      Alert.alert("Could not extract colors", "Try another image or a smaller local file.");
    } finally {
      setIsExtracting(false);
    }
  };

  const saveTheme = async () => {
    if (!extractedColors) return;

    setIsSaving(true);

    try {
      const savedTheme = await appTheme.saveTheme(themeName || "Image Theme", colorsToThemeSet(extractedColors));

      setThemeName("");
      setStatus(`Saved and applied ${savedTheme.name}.`);
    } catch {
      Alert.alert("Could not save theme", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Palette" }} />
      <ScrollView
        className="flex-1 bg-[--app-color-background]"
        contentContainerClassName="gap-5 px-5 pb-12 pt-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="text-3xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
            Palette Playground
          </Text>
          <Text style={appTheme.text.muted}>
            Extract colors from an image, save it as a theme, then use it alongside Green and Blue.
          </Text>
        </View>

        <View className="flex-row gap-3">
          {(["light", "dark"] as const).map((scheme) => {
            const isSelected = appTheme.colorScheme === scheme;

            return (
              <Pressable
                key={scheme}
                className="flex-1 items-center rounded-2xl px-4 py-3"
                style={{
                  backgroundColor: isSelected ? appTheme.colors.primary : alpha(appTheme.colors.muted, 0.14),
                  borderColor: appTheme.colors.overlay,
                  borderWidth: 1,
                }}
                onPress={() => appTheme.setColorScheme(scheme)}
                accessibilityRole="button"
              >
                <Text
                  className="font-bold capitalize"
                  style={{ color: isSelected ? appTheme.colors.inverseForeground : appTheme.colors.foreground }}
                >
                  {scheme}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          className="h-64 overflow-hidden rounded-[28px]"
          style={{ backgroundColor: alpha(appTheme.colors.primary, 0.12) }}
          onPress={pickImage}
          accessibilityRole="button"
        >
          {imageUri ? (
            <Image source={imageUri} contentFit="cover" style={{ height: "100%", width: "100%" }} />
          ) : (
            <View className="flex-1 items-center justify-center gap-2 px-8">
              <Text className="text-center text-xl font-black" style={{ color: appTheme.colors.foreground }}>
                Pick an image
              </Text>
              <Text className="text-center" style={appTheme.text.muted}>
                Choose a photo with a strong mood or color palette.
              </Text>
            </View>
          )}
        </Pressable>

        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 items-center rounded-2xl px-4 py-3"
            style={{ backgroundColor: appTheme.colors.primary }}
            onPress={pickImage}
            accessibilityRole="button"
          >
            <Text className="font-bold" style={{ color: appTheme.colors.inverseForeground }}>
              {imageUri ? "Change Image" : "Pick Image"}
            </Text>
          </Pressable>

          <Pressable
            className="flex-1 items-center rounded-2xl px-4 py-3"
            style={{ backgroundColor: imageUri ? appTheme.colors.secondary : alpha(appTheme.colors.muted, 0.22) }}
            onPress={handleExtractPalette}
            disabled={!imageUri || isExtracting}
            accessibilityRole="button"
          >
            {isExtracting ? (
              <ActivityIndicator color={appTheme.colors.inverseForeground} />
            ) : (
              <Text className="font-bold" style={{ color: appTheme.colors.inverseForeground }}>
                Extract
              </Text>
            )}
          </Pressable>
        </View>

        {status ? <Text style={appTheme.text.caption}>{status}</Text> : null}

        {extractedColors ? (
          <View className="gap-4 rounded-[28px] p-4" style={{ backgroundColor: alpha(appTheme.colors.muted, 0.12) }}>
            <Text className="text-lg font-black" style={{ color: appTheme.colors.foreground }}>
              Theme Mapping
            </Text>
            <Text style={appTheme.text.caption}>
              Platform: {debugPlatform}. Ini warna yang app pilih untuk token theme setelah membaca hasil mentah.
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {swatchLabels.map((label) => (
                <View key={label} className="w-[30%] gap-1">
                  <View
                    className="h-14 rounded-2xl"
                    style={{
                      backgroundColor: extractedColors[label],
                      borderColor: appTheme.colors.overlay,
                      borderWidth: 1,
                    }}
                  />
                  <Text className="text-xs font-semibold capitalize" style={{ color: appTheme.colors.muted }}>
                    {label}
                  </Text>
                  <Text className="text-xs font-bold" style={{ color: appTheme.colors.foreground }}>
                    {extractedColors[label]}
                  </Text>
                </View>
              ))}
            </View>

            <View className="gap-3 rounded-3xl p-3" style={{ backgroundColor: alpha(appTheme.colors.background, 0.72) }}>
              <Text className="font-black" style={{ color: appTheme.colors.foreground }}>
                Raw Extract Result
              </Text>
              <Text style={appTheme.text.caption}>
                iOS biasanya mengembalikan primary, secondary, detail, background. Android biasanya mengembalikan vibrant,
                lightVibrant, muted, lightMuted, darkVibrant.
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {Object.entries(debugColors).map(([label, color]) => (
                  <View key={label} className="w-[30%] gap-1">
                    <View
                      className="h-14 rounded-2xl"
                      style={{
                        backgroundColor: color,
                        borderColor: appTheme.colors.overlay,
                        borderWidth: 1,
                      }}
                    />
                    <Text className="text-xs font-semibold" style={{ color: appTheme.colors.muted }}>
                      {label}
                    </Text>
                    <Text className="text-xs font-bold" style={{ color: appTheme.colors.foreground }}>
                      {color}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <TextInput
              className="rounded-2xl px-4 py-3 text-base"
              value={themeName}
              onChangeText={setThemeName}
              placeholder="Theme name, e.g. Forest Morning"
              placeholderTextColor={appTheme.colors.muted}
              style={{
                backgroundColor: appTheme.colors.background,
                color: appTheme.colors.foreground,
                borderColor: appTheme.colors.overlay,
                borderWidth: 1,
              }}
            />

            <Pressable
              className="items-center rounded-2xl px-4 py-3"
              style={{ backgroundColor: appTheme.colors.primary }}
              onPress={saveTheme}
              disabled={isSaving}
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator color={appTheme.colors.inverseForeground} />
              ) : (
                <Text className="font-bold" style={{ color: appTheme.colors.inverseForeground }}>
                  Save & Apply Theme
                </Text>
              )}
            </Pressable>
          </View>
        ) : null}

        <View className="gap-3">
          <Text className="text-lg font-black" style={{ color: appTheme.colors.foreground }}>
            Theme List
          </Text>
          {appTheme.availableThemes.map((themeOption) => (
            <View
              key={themeOption.slug}
              className="flex-row items-center gap-3 rounded-2xl p-3"
              style={{
                backgroundColor: themeOption.slug === appTheme.theme ? alpha(appTheme.colors.primary, 0.14) : "transparent",
                borderColor: appTheme.colors.overlay,
                borderWidth: 1,
              }}
            >
              <Pressable className="min-w-0 flex-1" onPress={() => appTheme.setTheme(themeOption.slug)}>
                <Text className="font-bold" style={{ color: appTheme.colors.foreground }}>
                  {themeOption.name}
                </Text>
                <Text style={appTheme.text.caption}>{themeOption.isCustom ? "Custom theme" : "Built-in theme"}</Text>
              </Pressable>
              {themeOption.isCustom ? (
                <Pressable
                  className="rounded-xl px-3 py-2"
                  style={{ backgroundColor: alpha(appTheme.colors.muted, 0.16) }}
                  onPress={() => appTheme.deleteTheme(themeOption.slug)}
                  accessibilityRole="button"
                >
                  <Text className="font-bold" style={{ color: appTheme.colors.foreground }}>
                    Delete
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>

        <Pressable
          className="items-center rounded-2xl px-6 py-3"
          style={{ backgroundColor: alpha(appTheme.colors.primary, 0.12) }}
          onPress={() => router.push("/home")}
          accessibilityRole="button"
        >
          <Text className="font-bold" style={{ color: appTheme.colors.primary }}>
            Go to Cashflow
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}
