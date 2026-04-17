import { type ReactNode } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingBag, Users,
  Tag, Image as ImageIcon, Star, BarChart3, Settings, ChevronRight, MessageSquare,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderOpen },
      { href: "/admin/inventory", label: "Inventory", icon: BarChart3 },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/coupons", label: "Coupons", icon: Tag },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/inquiries", label: "Contact Inquiries", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-gray-900 border-r border-gray-800 fixed top-0 left-0 h-full z-40">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <NextImage
              src="/images/brand/logo.png"
              alt="Magadh Recipe"
              width={36}
              height={36}
              sizes="36px"
              className="w-9 h-9 rounded-lg object-contain shadow-[0_2px_12px_rgba(212,132,58,0.4)]"
            />
            <div>
              <p className="text-white text-sm font-semibold leading-none">Magadh Recipe</p>
              <p className="text-gray-400 text-xs mt-0.5">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors group"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-3 border-t border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
              {session.user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{session.user?.name}</p>
              <p className="text-gray-500 text-[10px] truncate">{session.user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-60 flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Link href="/admin" className="hover:text-gray-300">Admin</Link>
            <ChevronRight className="w-3 h-3" />
          </div>
          <Link href="/" target="_blank" className="text-xs text-gray-400 hover:text-white transition-colors">
            View Store →
          </Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
