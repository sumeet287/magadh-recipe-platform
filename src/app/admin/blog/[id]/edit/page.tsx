import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogPostForm, type BlogInitial } from "@/components/admin/blog-post-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: post ? `Edit ${post.title} | Blog` : "Edit Post | Blog | Admin",
  };
}

function normaliseFaqs(raw: unknown): BlogInitial["faqs"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (r): r is { question: string; answer: string } =>
        !!r &&
        typeof r === "object" &&
        typeof (r as { question?: unknown }).question === "string" &&
        typeof (r as { answer?: unknown }).answer === "string"
    )
    .map((r) => ({ question: r.question, answer: r.answer }));
}

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  const initial: BlogInitial = {
    slug: post.slug,
    title: post.title,
    subtitle: post.subtitle,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    coverImageAlt: post.coverImageAlt,
    categoryId: post.categoryId,
    tags: post.tags,
    readTimeMinutes: post.readTimeMinutes,
    authorName: post.authorName,
    status: post.status,
    publishedAt: post.publishedAt,
    metaTitle: post.metaTitle,
    metaDesc: post.metaDesc,
    metaKeywords: post.metaKeywords,
    ogImage: post.ogImage,
    schemaType: post.schemaType,
    recipeYield: post.recipeYield,
    prepTimeMinutes: post.prepTimeMinutes,
    cookTimeMinutes: post.cookTimeMinutes,
    recipeCuisine: post.recipeCuisine,
    recipeCategoryName: post.recipeCategoryName,
    recipeIngredients: post.recipeIngredients,
    recipeInstructions: post.recipeInstructions,
    faqs: normaliseFaqs(post.faqs),
  };

  return <BlogPostForm mode="edit" postId={post.id} initial={initial} />;
}
