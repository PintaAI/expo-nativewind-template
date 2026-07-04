import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function QuickFillFormSheet() {
  return (
    <SidebarFormSheet
      title="Quick Fill"
      description="Mock shortcut form for frequently used entries."
      icon="bolt.fill"
      fields={["Shortcut label", "Default amount", "Category", "Wallet"]}
    />
  );
}
