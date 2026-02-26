"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Star, Minus, Plus, ShoppingCart, Package, RotateCcw, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default function ProductPage({ params }: Props) {
  const { id } = use(params);
  const products = useStore((s) => s.products);
  const addToCart = useStore((s) => s.addToCart);
  const product = products.find((p) => p.id === id);

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="font-serif text-3xl text-foreground mb-4">Product not found</p>
            <Link href="/shop" className="text-accent hover:underline">
              Back to Shop
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
                Home
              </Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-foreground transition-colors">
                Shop
              </Link>
              <span>/</span>
              <Link
                href={`/shop?category=${product.category}`}
                className="hover:text-foreground transition-colors"
              >
                {product.category}
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
            <div className="relative aspect-[4/3] lg:aspect-square rounded-xl overflow-hidden bg-muted">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {product.originalPrice && (
                <span className="absolute top-4 left-4 bg-accent text-accent-foreground text-sm font-semibold px-3 py-1.5 rounded">
                  Save ${savings?.toLocaleString()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col">
              <Link
                href={`/shop?category=${product.category}`}
                className="text-xs uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors font-medium"
              >
                {product.category}
              </Link>
              <h1 className="font-serif text-4xl font-bold text-foreground mt-2 leading-tight text-balance">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < Math.floor(product.rating)
                          ? "fill-accent text-accent"
                          : "fill-muted text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {product.rating}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({product.reviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mt-6">
                <span className="text-3xl font-bold text-foreground">
                  ${product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed mt-6 text-sm">
                {product.description}
              </p>

              {/* Specs */}
              <div className="mt-7 grid grid-cols-2 gap-3">
                {[
                  { label: "Dimensions", value: product.dimensions },
                  { label: "Material", value: product.material },
                  { label: "SKU", value: product.sku },
                  {
                    label: "Availability",
                    value:
                      product.stock > 5
                        ? "In Stock"
                        : product.stock > 0
                        ? `Only ${product.stock} left`
                        : "Out of Stock",
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
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-semibold min-w-[2.5rem] text-center text-foreground">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    className="p-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Increase quantity"
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
                  {added ? "Added to Cart!" : "Add to Cart"}
                </button>
              </div>

              {/* Trust badges */}
              <div className="mt-8 pt-8 border-t border-border grid grid-cols-3 gap-4">
                {[
                  { icon: Package, label: "Free Delivery", sub: "Orders over $999" },
                  { icon: RotateCcw, label: "30-Day Returns", sub: "Easy returns" },
                  { icon: Shield, label: "10-Year Warranty", sub: "Solid wood" },
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
                You May Also Like
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
