import { useTranslation } from "react-i18next";
import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function TagsForm() {
  const { t } = useTranslation();
  return (
    <SidebarFormSheet
      title={t("tags.title")}
      description={t("tags.description")}
      icon="tag.fill"
      fields={[t("tags.fieldName"), t("tags.fieldColor")]}
      androidFitToContents
    />
  );
}
