import Link from "next/link";
import NextImage from "next/image";
import { FileText, Plus, Pencil, ExternalLink, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Blog | Magadh Recipe Admin" };

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: "bg-green-900/40 text-green-400",
  DRAFT: "bg-amber-900/40 text-amber-400",
  ARCHIVED: "bg-gray-800 text-gray-400",
};

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: { category: { select: { name: true, slug: true } } },
  });

  const counts = {
    total: posts.length,
    published: posts.filter((p) => p.status === "PUBLISHED").length,
    drafts: posts.filter((p) => p.status === "DRAFT").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white">Blog</h1>
          <p className="text-gray-400 text-sm mt-1">
            {counts.total} posts · {counts.published} published · {counts.drafts} drafts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Link href="/admin/blog/categories" className="inline-flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Categories
            </Link>
          </Button>
          <Button asChild className="bg-brand-600 hover:bg-brand-500">
            <Link href="/admin/blog/new" className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New post
            </Link>
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-16 text-center">
          <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h2 className="text-white font-semibold">No blog posts yet</h2>
          <p className="text-gray-500 text-sm mt-1 mb-5">
            Publish your first article to start building topical authority.
          </p>
          <Button asChild className="bg-brand-600 hover:bg-brand-500">
            <Link href="/admin/blog/new">Write your first post</Link>
          </Button>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-left">
                <th className="px-6 py-3 font-medium">Post</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Updated</th>
                <th className="px-6 py-3 font-medium w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {post.coverImage ? (
                        <NextImage
                          src={post.coverImage}
                          alt={post.coverImageAlt ?? post.title}
                          width={48}
                          height={32}
                          className="w-12 h-8 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-8 rounded bg-gray-800 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white font-medium line-clamp-1">{post.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5 font-mono line-clamp-1">
                          /blog/{post.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {post.category?.name ?? <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-800 text-gray-300">
                      {post.schemaType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STATUS_STYLE[post.status] ?? "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(post.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/blog/${post.id}/edit`}
                        className="inline-flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 font-medium"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      {post.status === "PUBLISHED" && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
