"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ScrollText,
  ChevronRight,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Inventory", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

type Props = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const addAuditLog = useStore((s) => s.addAuditLog);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  function handleLogout() {
    addAuditLog({
      action: "User Logout",
      category: "user",
      user: currentUser!.email,
      details: `${currentUser!.name} (${currentUser!.email}) signed out`,
      severity: "info",
    });
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-16 md:w-60 flex-shrink-0 bg-sidebar flex flex-col min-h-screen sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-sidebar-primary rounded flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground font-serif font-bold text-sm">M</span>
            </div>
            <div className="hidden md:block">
              <p className="font-serif font-bold text-sidebar-foreground text-sm leading-tight">
                Maison & Co.
              </p>
              <p className="text-xs text-sidebar-foreground/50">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden md:inline">{label}</span>
                {isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto hidden md:block text-sidebar-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">Back to Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-sidebar-primary-foreground font-semibold">
                {currentUser.name.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {currentUser.email}
              </p>
              <p className="text-xs text-sidebar-foreground/40">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Breadcrumb header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Admin</span>
            {pathname !== "/admin" && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium capitalize">
                  {pathname.replace("/admin/", "").replace("-", " ")}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
