import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNativeTheme } from "./AppTheme";

export default function AppSidebar() {
  const nativeTheme = useNativeTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 gap-3 p-6"
      style={{
        backgroundColor: nativeTheme.colors.background,
        paddingTop: insets.top + 16,
      }}
    >
      <Text className="text-2xl font-bold text-foreground">Sidebar</Text>
      <Text className="text-base text-muted">Sidebar content goes here</Text>
    </View>
  );
}
