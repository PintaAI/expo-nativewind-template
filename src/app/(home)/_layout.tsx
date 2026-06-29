import { Drawer } from "expo-router/drawer";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNativeTheme } from "@/components/useNativeTheme";

export default function HomeLayout() {
  const nativeTheme = useNativeTheme();
  const insets = useSafeAreaInsets();

  return (
    <Drawer
      drawerContent={() => (
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
      )}
      screenOptions={{
        drawerActiveBackgroundColor: nativeTheme.colors.primary,
        drawerActiveTintColor: nativeTheme.colors.inverseForeground,
        drawerInactiveTintColor: nativeTheme.colors.muted,
        drawerItemStyle: {
          borderRadius: 16,
          marginHorizontal: 12,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: "600",
        },
        drawerStyle: {
          backgroundColor: nativeTheme.colors.background,
          width: 320,
        },
        drawerType: "slide",
        headerShown: false,
        overlayColor: nativeTheme.colors.overlay,
        sceneStyle: {
          backgroundColor: nativeTheme.colors.background,
        },
        swipeEdgeWidth: 48,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Home",
        }}
      />
    </Drawer>
  );
}
