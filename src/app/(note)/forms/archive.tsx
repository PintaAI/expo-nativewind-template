import { useTranslation } from "react-i18next";
import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function ArchiveForm() {
  const { t } = useTranslation();
  return (
    <SidebarFormSheet
      title={t("archive.title")}
      description={t("archive.description")}
      icon="archivebox.fill"
      fields={[t("archive.fieldSearch"), t("archive.fieldSortBy"), t("archive.fieldDateRange")]}
      actions={[t("common.close")]}
    />
  );
}
