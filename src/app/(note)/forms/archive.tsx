import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function ArchiveForm() {
  return (
    <SidebarFormSheet
      title="Archive"
      description="View archived notes"
      icon="archivebox.fill"
      fields={["Search", "Sort by", "Date range"]}
      actions={["Close"]}
    />
  );
}
