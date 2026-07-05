import { Stack } from "expo-router";

export default function WalletLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerLargeTitle: false,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Wallet" }} />
      <Stack.Screen name="detail" options={{ title: "Wallet Detail" }} />
    </Stack>
  );
}
