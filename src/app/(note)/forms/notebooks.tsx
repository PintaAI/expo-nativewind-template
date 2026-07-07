import { useTranslation } from "react-i18next";
import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function NotebooksForm() {
  const { t } = useTranslation();
  return (
    <SidebarFormSheet
      title={t("notebooks.title")}
      description={t("notebooks.description")}
      icon="book.fill"
      fields={[t("notebooks.fieldName"), t("notebooks.fieldDescription"), t("notebooks.fieldColor")]}
    />
  );
}
