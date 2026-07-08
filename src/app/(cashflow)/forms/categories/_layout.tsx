import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function CategoriesLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerLargeTitle: false,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: t("sidebar.categoriesBudget") }} />
      <Stack.Screen name="detail" options={{ title: t("categories.categoryDetail") }} />
    </Stack>
  );
}
