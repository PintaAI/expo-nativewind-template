import { useTranslation } from "react-i18next";
import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function StatieFormSheet() {
  const { t } = useTranslation();
  return (
    <SidebarFormSheet
      title={t("statie.title")}
      description={t("statie.description")}
      icon="gamecontroller.fill"
      fields={[t("statie.fieldPlayer"), t("statie.fieldMode"), t("statie.fieldDifficulty")]}
      actions={[t("common.close"), t("common.start")]}
      androidFitToContents
    />
  );
}
