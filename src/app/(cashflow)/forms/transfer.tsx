import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function TransferFormSheet() {
  return (
    <SidebarFormSheet
      title="Transfer"
      description="Mock transfer flow between wallets."
      icon="arrow.left.arrow.right"
      fields={["From wallet", "To wallet", "Amount", "Transfer date"]}
    />
  );
}
