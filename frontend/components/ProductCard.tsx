"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { useStore, type Product } from "@/lib/store";
import { usePreferences } from "@/lib/preferences";
import { siteText, translateCategory } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  className?: string;
};

export default function ProductCard({ product, className }: Props) {
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const updateCartQuantity = useStore((s) => s.updateCartQuantity);
  const locale = usePreferences((s) => s.locale);
  const t = siteText[locale].productCard;
  const cartItem = cart.find((item) => item.product.id === product.id);
  const quantityInCart = cartItem?.quantity ?? 0;

  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-lg border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg",
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
              {t.sale}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {translateCategory(locale, product.category)}
        </p>
        <Link href={`/product/${product.id}`}>
          <h3 className="font-serif text-lg font-semibold text-foreground hover:text-accent transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <p className="mt-2 text-xs text-accent font-medium">
            {t.onlyLeft.replace("{count}", String(product.stock))}
          </p>
        )}
        {product.stock === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">{t.outOfStock}</p>
        )}

        <div className="mt-auto pt-4">
          {quantityInCart > 0 ? (
            <div className="flex w-full items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-1">
              <button
                type="button"
                onClick={() => updateCartQuantity(product.id, quantityInCart - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10"
                aria-label={siteText[locale].cart.decrease}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground">
                  {quantityInCart}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateCartQuantity(product.id, quantityInCart + 1)}
                disabled={quantityInCart >= product.stock}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={siteText[locale].cart.increase}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className="flex w-full items-center justify-center gap-2 rounded bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t.addToCartAria.replace("{name}", product.name)}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {t.add}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
