import { useTranslation } from "react-i18next";
import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function ReminderFormSheet() {
  const { t } = useTranslation();
  return (
    <SidebarFormSheet
      title={t("reminder.title")}
      description={t("reminder.description")}
      icon="bell.fill"
      fields={[t("reminder.fieldTitle"), t("reminder.fieldTime"), t("reminder.fieldRepeat"), t("reminder.fieldNote")]}
    />
  );
}
