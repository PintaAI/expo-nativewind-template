import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function AutomaticEntryFormSheet() {
  return (
    <SidebarFormSheet
      title="Catat Otomatis"
      description="Mock automation rule for recurring cashflow entries."
      icon="repeat.circle.fill"
      fields={["Rule name", "Amount", "Schedule", "Category"]}
    />
  );
}
