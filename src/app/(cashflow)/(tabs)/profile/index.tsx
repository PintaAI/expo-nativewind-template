import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { ProfileContent } from "@/components/profile/ProfileContent";

export default function ProfileScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Title>{t('tabs.profile')}</Stack.Title>
      <ProfileContent />
    </>
  );
}
