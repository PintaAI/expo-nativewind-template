import { Stack } from "expo-router";
import { Text, View } from "react-native";

export default function SettingsDetail() {
  return (
    <View className="flex-1 bg-background px-5 pt-6">
      <Stack.Screen options={{ title: "Setting Detail" }} />
      <Text className="text-2xl font-bold text-foreground">Setting Detail</Text>
      <Text className="mt-3 text-base leading-6 text-muted">
        This is a pushed detail screen for a settings row. Use this pattern for deeper
        configuration flows that need their own navigation state.
      </Text>
    </View>
  );
}
