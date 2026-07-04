import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function ReminderFormSheet() {
  return (
    <SidebarFormSheet
      title="Reminder"
      description="Mock reminder form for scheduled cashflow prompts."
      icon="bell.fill"
      fields={["Reminder title", "Time", "Repeat", "Note"]}
    />
  );
}
