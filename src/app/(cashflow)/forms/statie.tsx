import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function StatieFormSheet() {
  return (
    <SidebarFormSheet
      title="Statie"
      description="Mock game setup sheet for the Statie nav item."
      icon="gamecontroller.fill"
      fields={["Player name", "Mode", "Difficulty"]}
      actions={["Close", "Start"]}
    />
  );
}
