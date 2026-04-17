import { CategoryForm } from "@/components/admin/category-form";

export const metadata = { title: "New Category | Magadh Recipe Admin" };

export default function NewCategoryPage() {
  return <CategoryForm mode="create" />;
}
