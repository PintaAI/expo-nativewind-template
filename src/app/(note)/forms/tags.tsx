import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function TagsForm() {
  return (
    <SidebarFormSheet
      title="Tags"
      description="Manage note tags"
      icon="tag.fill"
      fields={["Tag name", "Color"]}
    />
  );
}
