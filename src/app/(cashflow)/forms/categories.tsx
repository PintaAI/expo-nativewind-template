import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function CategoriesFormSheet() {
  return (
    <SidebarFormSheet
      title="Categories"
      description="Mock category editor for income and expense labels."
      icon="tag.fill"
      fields={["Category name", "Type", "Icon", "Monthly limit"]}
    />
  );
}
