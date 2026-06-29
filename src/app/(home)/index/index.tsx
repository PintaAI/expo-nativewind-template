import { Stack, useNavigation } from "expo-router";
import { Text, View } from "react-native";
import { APP_NAME } from "@/config/app";

type DrawerNavigation = {
  openDrawer: () => void;
};

export default function Index() {
  const drawer = useNavigation("/(home)" as any) as unknown as DrawerNavigation;

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="sidebar.left" onPress={() => drawer.openDrawer()} />
      </Stack.Toolbar>
      <Text className="text-xl font-bold text-primary">Welcome to {APP_NAME}</Text>
    </View>
  );
}
