import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function BudgetFormSheet() {
  return (
    <SidebarFormSheet
      title="Budget"
      description="Mock budget form for planning a category or wallet limit."
      icon="chart.pie.fill"
      fields={["Budget name", "Category", "Limit amount", "Period"]}
    />
  );
}
