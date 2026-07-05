import { Pressable, View } from "react-native";
import { Stack, router } from "expo-router";
import { AppText as Text } from "@/components/AppText";
import { useAppTheme } from "@/components/AppTheme";
import { alpha } from "@/lib/color";

export default function Home() {
  const appTheme = useAppTheme();

  return (
    <View className="flex-1 justify-between px-5 pb-8 pt-6" style={{ backgroundColor: appTheme.colors.background }}>
      <Stack.Screen
        options={{
          title: "Ethos",
          contentStyle: { backgroundColor: appTheme.colors.background },
          headerStyle: { backgroundColor: appTheme.colors.background },
          headerTintColor: appTheme.colors.foreground,
        }}
      />

      <View className="gap-6">
        <View className="gap-3">
          <Text className="text-4xl font-black tracking-tight" style={{ color: appTheme.colors.foreground }}>
            Ethos
          </Text>
          <Text style={appTheme.text.muted}>
            Your cashflow and notes workspace, tuned for fast capture and simple review.
          </Text>
        </View>

        <View className="gap-3">
          <Pressable
            className="items-center rounded-full px-6 py-4"
            style={{ backgroundColor: appTheme.colors.primary }}
            onPress={() => router.push("/auth")}
            accessibilityRole="button"
          >
            <Text className="font-bold" style={{ color: appTheme.colors.inverseForeground }}>
              Sign in or create account
            </Text>
          </Pressable>

          <Pressable
            className="items-center rounded-full px-6 py-4"
            style={{ backgroundColor: alpha(appTheme.colors.primary, 0.12) }}
            onPress={() => router.push("/home")}
            accessibilityRole="button"
          >
            <Text className="font-bold" style={{ color: appTheme.colors.primary }}>
              Continue to Cashflow
            </Text>
          </Pressable>
        </View>
      </View>

      <Text className="text-sm" style={appTheme.text.muted}>
        Google and Apple sign-in are handled by Better Auth in a secure browser session.
      </Text>
    </View>
  );
}
