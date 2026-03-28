"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";

const CATEGORY_OPTIONS = [
  "Living Room",
  "Bedroom",
  "Dining Room",
  "Home Office",
  "Storage",
  "Lighting",
  "Rugs & Textiles",
];

type ProductDraft = {
  id: string;
  name: string;
  category: string;
  price: string;
  originalPrice: string;
  image: string;
  description: string;
  dimensions: string;
  material: string;
  stock: string;
  sku: string;
  featured: boolean;
  rating: string;
  reviews: string;
};

type Props = {
  initialProduct: Product;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (product: Product) => Promise<void>;
};

function toDraft(product: Product): ProductDraft {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : "",
    image: product.image,
    description: product.description,
    dimensions: product.dimensions,
    material: product.material,
    stock: String(product.stock),
    sku: product.sku,
    featured: product.featured,
    rating: String(product.rating),
    reviews: String(product.reviews),
  };
}

export function createEmptyProduct(): Product {
  return {
    id: "",
    name: "",
    category: CATEGORY_OPTIONS[0],
    price: 0,
    image: "",
    description: "",
    dimensions: "",
    material: "",
    stock: 0,
    sku: "",
    featured: false,
    rating: 0,
    reviews: 0,
  };
}

export default function ProductForm({ initialProduct, submitLabel, isSubmitting, onSubmit }: Props) {
  const [draft, setDraft] = useState<ProductDraft>(() => toDraft(initialProduct));
  const [error, setError] = useState<string | null>(null);

  const previewPrice = useMemo(() => Number(draft.price || 0), [draft.price]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload: Product = {
      id: draft.id.trim(),
      name: draft.name.trim(),
      category: draft.category.trim(),
      price: Number(draft.price),
      originalPrice: draft.originalPrice ? Number(draft.originalPrice) : undefined,
      image: draft.image.trim(),
      description: draft.description.trim(),
      dimensions: draft.dimensions.trim(),
      material: draft.material.trim(),
      stock: Number(draft.stock),
      sku: draft.sku.trim(),
      featured: draft.featured,
      rating: Number(draft.rating),
      reviews: Number(draft.reviews),
    };

    if (!payload.name || !payload.category || !payload.image || !payload.description || !payload.dimensions || !payload.material || !payload.sku) {
      setError("Fill in all required fields before saving.");
      return;
    }

    if ([payload.price, payload.stock, payload.rating, payload.reviews].some((value) => Number.isNaN(value))) {
      setError("Price, stock, rating, and reviews must be valid numbers.");
      return;
    }

    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground">Core Details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Product ID</span>
                <input
                  value={draft.id}
                  onChange={(e) => setDraft((current) => ({ ...current, id: e.target.value }))}
                  placeholder="Leave blank to auto-generate"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">SKU</span>
                <input
                  required
                  value={draft.sku}
                  onChange={(e) => setDraft((current) => ({ ...current, sku: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Name</span>
                <input
                  required
                  value={draft.name}
                  onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Category</span>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft((current) => ({ ...current, category: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Image Path</span>
                <input
                  required
                  value={draft.image}
                  onChange={(e) => setDraft((current) => ({ ...current, image: e.target.value }))}
                  placeholder="/images/prod-chair-1.jpg"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Description</span>
                <textarea
                  required
                  value={draft.description}
                  onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))}
                  rows={5}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Dimensions</span>
                <input
                  required
                  value={draft.dimensions}
                  onChange={(e) => setDraft((current) => ({ ...current, dimensions: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Material</span>
                <input
                  required
                  value={draft.material}
                  onChange={(e) => setDraft((current) => ({ ...current, material: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground">Commerce</h2>
            <div className="mt-4 space-y-4">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Price</span>
                <input
                  type="number"
                  min="0"
                  value={draft.price}
                  onChange={(e) => setDraft((current) => ({ ...current, price: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Original Price</span>
                <input
                  type="number"
                  min="0"
                  value={draft.originalPrice}
                  onChange={(e) => setDraft((current) => ({ ...current, originalPrice: e.target.value }))}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Stock</span>
                <input
                  type="number"
                  min="0"
                  value={draft.stock}
                  onChange={(e) => setDraft((current) => ({ ...current, stock: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Rating</span>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={draft.rating}
                  onChange={(e) => setDraft((current) => ({ ...current, rating: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Reviews</span>
                <input
                  type="number"
                  min="0"
                  value={draft.reviews}
                  onChange={(e) => setDraft((current) => ({ ...current, reviews: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => setDraft((current) => ({ ...current, featured: e.target.checked }))}
                  className="h-4 w-4"
                />
                <span className="text-sm text-foreground">Featured product</span>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground">Preview</h2>
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-medium text-foreground">{draft.name || "Untitled product"}</p>
              <p className="text-muted-foreground">{draft.category || "No category"}</p>
              <p className="text-foreground">${previewPrice.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{draft.image || "No image path yet"}</p>
            </div>
          </section>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
