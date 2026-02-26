"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart } from "lucide-react";
import { useStore, type Product } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  className?: string;
};

export default function ProductCard({ product, className }: Props) {
  const addToCart = useStore((s) => s.addToCart);

  return (
    <article
      className={cn(
        "group bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {product.originalPrice && (
            <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-1 rounded">
              SALE
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-serif text-lg font-semibold text-foreground hover:text-accent transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < Math.floor(product.rating)
                    ? "fill-accent text-accent"
                    : "fill-muted text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({product.reviews})
          </span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-foreground">
              ${product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-medium px-3.5 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {product.stock <= 5 && product.stock > 0 && (
          <p className="mt-2 text-xs text-accent font-medium">
            Only {product.stock} left in stock
          </p>
        )}
        {product.stock === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Out of stock</p>
        )}
      </div>
    </article>
  );
}
