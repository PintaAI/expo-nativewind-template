import { SidebarFormSheet } from "@/components/sidebar/SidebarFormSheet";

export default function NotebooksForm() {
  return (
    <SidebarFormSheet
      title="Notebooks"
      description="Manage your note notebooks"
      icon="book.fill"
      fields={["Notebook name", "Description", "Color"]}
    />
  );
}
