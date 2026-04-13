"use client";

import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import { siteText, translateCategory } from "@/lib/i18n";

export default function Footer() {
  const locale = usePreferences((s) => s.locale);
  const t = siteText[locale].footer;
  const footerLinks = {
    [t.shop]: [
      { label: translateCategory(locale, "Living Room"), href: "/shop?category=Living Room" },
      { label: translateCategory(locale, "Bedroom"), href: "/shop?category=Bedroom" },
      { label: translateCategory(locale, "Dining Room"), href: "/shop?category=Dining Room" },
      { label: translateCategory(locale, "Home Office"), href: "/shop?category=Home Office" },
      { label: translateCategory(locale, "Lighting"), href: "/shop?category=Lighting" },
      { label: t.sale, href: "/shop?sale=true" },
    ],
    [t.company]: [
      { label: t.about, href: "/info/about" },
      { label: t.sustainability, href: "/info/sustainability" },
      { label: t.careers, href: "/info/careers" },
      { label: t.press, href: "/info/press" },
    ],
    [t.support]: [
      { label: t.faq, href: "/info/faq" },
      { label: t.shipping, href: "/info/shipping" },
      { label: t.careGuide, href: "/info/care" },
      { label: t.contact, href: "/info/contact" },
    ],
  };

  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-primary-foreground">
              Maison <span style={{ color: "oklch(0.62 0.10 45)" }}>&</span> Co.
            </span>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/60 max-w-xs">
              {t.brandText}
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/50 mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between gap-4">
          <p className="text-xs text-primary-foreground/40">
            © 2026 Maison & Co. {t.rights}
          </p>
          <div className="flex gap-6">
            {[
              { label: t.privacy, href: "/info/privacy" },
              { label: t.terms, href: "/info/terms" },
              { label: t.cookies, href: "/info/cookies" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
