import Link from "next/link";
import { Instagram, Facebook, Twitter, Mail } from "lucide-react";

const footerLinks = {
  Shop: [
    { label: "Living Room", href: "/shop?category=Living Room" },
    { label: "Bedroom", href: "/shop?category=Bedroom" },
    { label: "Dining Room", href: "/shop?category=Dining Room" },
    { label: "Home Office", href: "/shop?category=Home Office" },
    { label: "Lighting", href: "/shop?category=Lighting" },
    { label: "Sale", href: "/shop?sale=true" },
  ],
  Company: [
    { label: "About Us", href: "/" },
    { label: "Sustainability", href: "/" },
    { label: "Careers", href: "/" },
    { label: "Press", href: "/" },
  ],
  Support: [
    { label: "FAQ", href: "/" },
    { label: "Shipping & Returns", href: "/" },
    { label: "Care Guide", href: "/" },
    { label: "Contact Us", href: "/" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <span className="font-serif text-2xl font-bold tracking-tight text-primary-foreground">
              Maison <span style={{ color: "oklch(0.62 0.10 45)" }}>&</span> Co.
            </span>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/60 max-w-xs">
              Crafting spaces where design meets everyday living. Every piece in our
              collection is thoughtfully sourced and built to last.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {[Instagram, Facebook, Twitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-primary-foreground/50 hover:text-primary-foreground transition-colors"
                  aria-label="Social media"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
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

        {/* Newsletter */}
        <div className="mt-12 pt-10 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="font-serif text-lg font-semibold text-primary-foreground">
                Stay in the loop
              </h3>
              <p className="text-sm text-primary-foreground/60 mt-1">
                New arrivals, exclusive offers, and design inspiration.
              </p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2.5 bg-primary-foreground/10 border border-primary-foreground/20 rounded text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-primary-foreground/40"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-accent text-accent-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity flex-shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between gap-4">
          <p className="text-xs text-primary-foreground/40">
            © 2026 Maison & Co. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Preferences"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
