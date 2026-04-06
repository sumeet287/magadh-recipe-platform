import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProductGrid } from "@/components/product/product-grid";
import { Heart } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Wishlist | Magadh Recipe" };

export default async function WishlistPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/account/wishlist");

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        include: {
          category: { select: { name: true, slug: true } },
          variants: { orderBy: { price: "asc" }, take: 1 },
          images: { where: { isPrimary: true }, take: 1 },
          reviews: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const products = wishlistItems.map((item) => {
    const variant = item.product.variants[0];
    const avgRating = item.product.reviews.length
      ? item.product.reviews.reduce((s, r) => s + r.rating, 0) / item.product.reviews.length
      : 0;
    return {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      shortDescription: null,
      isVeg: item.product.isVeg,
      spiceLevel: item.product.spiceLevel,
      isBestseller: item.product.isBestseller,
      isNewArrival: item.product.isNewArrival,
      category: item.product.category,
      images: item.product.images.map((img) => ({
        url: img.url,
        altText: img.altText ?? null,
        isPrimary: img.isPrimary,
      })),
      variants: item.product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        mrp: v.mrp,
        stock: v.stock,
        isDefault: v.isDefault,
      })),
      avgRating,
      reviewCount: item.product.reviews.length,
    };
  });

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-5 h-5 text-spice-500" />
        <h1 className="font-serif text-xl font-bold text-earth-dark">My Wishlist</h1>
        <span className="text-sm text-gray-400">({products.length} items)</span>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Your wishlist is empty</p>
          <p className="text-sm text-gray-400 mt-1">Save products to buy later.</p>
          <Link href="/products" className="mt-4 inline-block text-sm text-brand-600 font-medium">
            Discover Products →
          </Link>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
