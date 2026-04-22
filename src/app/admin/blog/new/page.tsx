import { BlogPostForm } from "@/components/admin/blog-post-form";

export const metadata = { title: "New Post | Blog | Magadh Recipe Admin" };

export default function NewBlogPostPage() {
  return <BlogPostForm mode="create" />;
}
