"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ScrollText,
  Users,
  ChevronRight,
  ArrowLeft,
  LogOut,
  TrendingUp,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { usePreferences } from "@/lib/preferences";
import { adminText, translateAdminRole } from "@/lib/admin-i18n";

const navItems = [
  { href: "/admin", key: "dashboard", icon: LayoutDashboard, roles: ["Administrator", "Manager", "Warehouse", "Executive"] },
  { href: "/admin/inventory", key: "inventory", icon: Package, roles: ["Administrator", "Manager", "Warehouse"] },
  { href: "/admin/orders", key: "orders", icon: ShoppingBag, roles: ["Administrator", "Manager", "Warehouse", "Executive"] },
  { href: "/admin/users", key: "users", icon: Users, roles: ["Administrator"] },
  { href: "/admin/forecast", key: "forecast", icon: TrendingUp, roles: ["Administrator", "Manager", "Executive"] },
  { href: "/admin/audit-log", key: "auditLog", icon: ScrollText, roles: ["Administrator", "Manager", "Warehouse", "Executive"] },
] as const;

type Props = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const addAuditLog = useStore((s) => s.addAuditLog);
  const locale = usePreferences((s) => s.locale);
  const t = adminText[locale].layout;

  const visibleNav = useMemo(() => {
    if (!currentUser) return [];
    return navItems.filter((item) => item.roles.includes(currentUser.role));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    const allowed = navItems.some((item) => pathname.startsWith(item.href) && item.roles.includes(currentUser.role));
    if (!allowed && pathname !== "/admin") {
      router.replace("/admin");
    }
  }, [currentUser, pathname, router]);

  if (!currentUser) return null;

  function handleLogout() {
    addAuditLog({
      action: "User Logout",
      category: "user",
      user: currentUser.email,
      details: `${currentUser.name} (${currentUser.email}) signed out`,
      severity: "info",
      result: "ok",
    });
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-16 md:w-60 flex-shrink-0 bg-sidebar flex flex-col min-h-screen sticky top-0 h-screen">
        <div className="px-4 py-5 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-sidebar-primary rounded flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground font-serif font-bold text-sm">M</span>
            </div>
            <div className="hidden md:block">
              <p className="font-serif font-bold text-sidebar-foreground text-sm leading-tight">Maison & Co.</p>
              <p className="text-xs text-sidebar-foreground/50">{t.panel}</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {visibleNav.map(({ href, key, icon: Icon }) => {
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
                <span className="hidden md:inline">{t[key]}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto hidden md:block text-sidebar-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">{t.backToStore}</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            <Settings2 className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">{t.settings}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">{t.signOut}</span>
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-sidebar-primary-foreground font-semibold">{currentUser.name.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{currentUser.email}</p>
              <p className="text-xs text-sidebar-foreground/40">{translateAdminRole(locale, currentUser.role)}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t.admin}</span>
            {pathname !== "/admin" && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium capitalize">{pathname.replace("/admin/", "").replace("-", " ")}</span>
              </>
            )}
          </div>
        </div>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
