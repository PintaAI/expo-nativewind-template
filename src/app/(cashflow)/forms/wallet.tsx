import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function WalletFormSheet() {
  return (
    <SidebarFormSheet
      title="Wallet"
      description="Mock setup for adding or editing a cash wallet. Replace this with the real wallet form later."
      icon="wallet.pass.fill"
      fields={["Wallet name", "Opening balance", "Currency"]}
    />
  );
}
