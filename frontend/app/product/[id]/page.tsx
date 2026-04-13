"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingCart, Package, RotateCcw, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { formatPrice } from "@/lib/currency";
import { useStore } from "@/lib/store";
import { usePreferences } from "@/lib/preferences";
import { siteText, translateCategory } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default function ProductPage({ params }: Props) {
  const { id } = use(params);
  const products = useStore((s) => s.products);
  const isBootstrapping = useStore((s) => s.isBootstrapping);
  const addToCart = useStore((s) => s.addToCart);
  const locale = usePreferences((s) => s.locale);
  const t = siteText[locale].productPage;
  const product = products.find((p) => p.id === id);

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (isBootstrapping && products.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t.loading}</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-serif text-3xl text-foreground mb-4">{t.notFound}</p>
            <Link href="/shop" className="text-accent hover:underline">
              {t.backToShop}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const savings = product.originalPrice
    ? product.originalPrice - product.price
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                {t.home}
              </Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-foreground transition-colors">
                {t.shop}
              </Link>
              <span>/</span>
              <Link
                href={`/shop?category=${product.category}`}
                className="hover:text-foreground transition-colors"
              >
                {translateCategory(locale, product.category)}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium truncate max-w-xs">
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Product Detail */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            {/* Image */}
            <div className="relative aspect-4/3 lg:aspect-square rounded-xl overflow-hidden bg-muted">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {product.originalPrice && (
                <span className="absolute top-4 left-4 bg-accent text-accent-foreground text-sm font-semibold px-3 py-1.5 rounded">
                  {t.save.replace("{amount}", formatPrice(savings ?? 0))}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <Link
                href={`/shop?category=${product.category}`}
                className="text-xs uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors font-medium"
              >
                {translateCategory(locale, product.category)}
              </Link>
              <h1 className="font-serif text-4xl font-bold text-foreground mt-2 leading-tight text-balance">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed mt-6 text-sm">
                {product.description}
              </p>

              {/* Specs */}
              <div className="mt-7 grid grid-cols-2 gap-3">
                  {[
                  { label: t.dimensions, value: product.dimensions },
                  { label: t.material, value: product.material },
                  { label: t.sku, value: product.sku },
                  {
                    label: t.details,
                    value:
                      product.stock > 5
                        ? t.stock.replace("{count}", String(product.stock))
                        : product.stock > 0
                        ? siteText[locale].productCard.onlyLeft.replace("{count}", String(product.stock))
                        : siteText[locale].productCard.outOfStock,
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted rounded-lg px-4 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      {label}
                    </p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Qty + Add to Cart */}
              <div className="flex items-center gap-4 mt-8">
                <div className="flex items-center border border-border rounded">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="p-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={siteText[locale].cart.decrease}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-semibold min-w-10 text-center text-foreground">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    className="p-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={siteText[locale].cart.increase}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3.5 rounded font-medium text-sm transition-all",
                    added
                      ? "bg-green-600 text-white"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  )}
                  >
                  <ShoppingCart className="w-4 h-4" />
                  {added ? t.added : t.addToCart}
                </button>
              </div>

              {/* Trust badges */}
              <div className="mt-8 pt-8 border-t border-border grid grid-cols-3 gap-4">
                {[
                  { icon: Package, label: t.shippingTitle, sub: t.shippingText },
                  { icon: RotateCcw, label: siteText[locale].home.perks.returns, sub: siteText[locale].home.perks.returnsDesc },
                  { icon: Shield, label: t.warrantyTitle, sub: t.warrantyText },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex flex-col items-center text-center gap-1.5">
                    <Icon className="w-5 h-5 text-accent" />
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="bg-muted py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-8">
                {t.related}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
