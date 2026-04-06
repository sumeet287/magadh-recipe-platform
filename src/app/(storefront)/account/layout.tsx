import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { ReactNode } from "react";
import Link from "next/link";
import { User, ShoppingBag, MapPin, Heart, Star, LogOut } from "lucide-react";

const navItems = [
  { href: "/account", label: "My Profile", icon: User, exact: true },
  { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/reviews", label: "My Reviews", icon: Star },
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/account");

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              {/* User info */}
              <div className="p-5 bg-gradient-to-br from-brand-500 to-spice-600 text-white">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mb-3">
                  {session.user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <p className="font-semibold truncate">{session.user?.name ?? "User"}</p>
                <p className="text-white/70 text-xs truncate">{session.user?.email}</p>
              </div>

              <nav className="p-3">
                {navItems.map(({ href, label, icon: Icon, exact }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-brand-500" />
                    {label}
                  </Link>
                ))}
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <Link
                    href="/api/auth/signout"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-spice-600 hover:bg-spice-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Link>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main */}
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </div>
  );
}
