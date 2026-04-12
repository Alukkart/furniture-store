"use client";

import Link from "next/link";
import {
  ShoppingCart,
  Menu,
  X,
  Search,
  LayoutDashboard,
  Settings2,
  LogOut,
  LogIn,
  UserRound,
  Languages,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { usePreferences } from "@/lib/preferences";
import { siteText, translateCategory } from "@/lib/i18n";
import CartDrawer from "./CartDrawer";

const navLinks = [
  { href: "/", key: "home", category: null },
  { href: "/shop", key: "shop", category: null },
  { href: "/shop?category=Living Room", key: null, category: "Living Room" },
  { href: "/shop?category=Bedroom", key: null, category: "Bedroom" },
  { href: "/shop?category=Dining Room", key: null, category: "Dining Room" },
];

const toolbarButtonClass =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground";

export default function Navbar() {
  const cart = useStore((s) => s.cart);
  const { currentUser, logout } = useAuth();
  const locale = usePreferences((s) => s.locale);
  const setLocale = usePreferences((s) => s.setLocale);
  const t = siteText[locale].navbar;
  const isAdminUser = !!currentUser && currentUser.role !== "Client";
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
                Maison <span className="text-accent">&</span> Co.
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                >
                  {link.key ? t[link.key] : translateCategory(locale, link.category ?? "")}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLocale(locale === "en" ? "ru" : "en")}
                className={toolbarButtonClass}
                aria-label={siteText[locale].languageShort}
                title={siteText[locale].languageShort}
              >
                <Languages className="w-5 h-5" />
              </button>
              {currentUser ? (
                <>
                  <Link
                    href="/account/orders"
                    className={toolbarButtonClass}
                    aria-label={t.account}
                  >
                    <UserRound className="w-5 h-5" />
                  </Link>
                  {isAdminUser && (
                    <Link
                      href="/admin"
                      className={toolbarButtonClass}
                      aria-label={t.dashboard}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    className={toolbarButtonClass}
                    aria-label={t.settings}
                  >
                    <Settings2 className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={logout}
                    className={toolbarButtonClass}
                    aria-label={t.signOut}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className={toolbarButtonClass}
                  aria-label={t.signIn}
                >
                  <LogIn className="w-5 h-5" />
                </Link>
              )}
              <button
                onClick={() => setCartOpen(true)}
                className={toolbarButtonClass}
                aria-label={`${t.cart} (${itemCount})`}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                    {itemCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={`md:hidden ${toolbarButtonClass}`}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <nav className="flex flex-col px-4 py-4 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider border-b border-border last:border-0"
                >
                  {link.key ? t[link.key] : translateCategory(locale, link.category ?? "")}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setLocale(locale === "en" ? "ru" : "en")}
                className="py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider border-b border-border"
              >
                {siteText[locale].languageShort}
              </button>
              {currentUser && (
                <>
                  <Link
                    href="/account/orders"
                    onClick={() => setMobileOpen(false)}
                    className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider border-b border-border"
                  >
                    {t.account}
                  </Link>
                  {isAdminUser ? (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider border-b border-border"
                    >
                      {t.dashboard}
                    </Link>
                  ) : (
                    <Link
                      href="/account/orders"
                      onClick={() => setMobileOpen(false)}
                      className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider border-b border-border"
                    >
                      {t.myOrders}
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    onClick={() => setMobileOpen(false)}
                    className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider border-b border-border"
                  >
                    {t.settings}
                  </Link>
                </>
              )}
              {!currentUser && (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider border-b border-border"
                >
                  {t.signIn}
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
