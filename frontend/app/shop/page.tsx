"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { usePreferences } from "@/lib/preferences";
import { siteText, translateCategory } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const CATEGORIES = [
  "All",
  "Living Room",
  "Bedroom",
  "Dining Room",
  "Home Office",
  "Storage",
  "Lighting",
  "Rugs & Textiles",
];

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const initialSale = searchParams.get("sale") === "true";

  const products = useStore((s) => s.products);
  const isBootstrapping = useStore((s) => s.isBootstrapping);
  const locale = usePreferences((s) => s.locale);
  const t = siteText[locale].shop;
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("featured");
  const [saleOnly, setSaleOnly] = useState(initialSale);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sortOptions = [
    { value: "featured", label: t.featured },
    { value: "price-asc", label: t.priceAsc },
    { value: "price-desc", label: t.priceDesc },
    { value: "name", label: t.name },
  ];

  const filtered = useMemo(() => {
    let list = [...products];

    if (category !== "All") list = list.filter((p) => p.category === category);
    if (saleOnly) list = list.filter((p) => !!p.originalPrice);
    list = list.filter((p) => p.price <= maxPrice);

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "featured":
      default:
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return list;
  }, [products, category, sort, saleOnly, maxPrice]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="bg-secondary border-b border-border py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
              {t.browse}
            </p>
            <h1 className="font-serif text-4xl font-bold text-foreground">
              {category === "All" ? t.allFurniture : translateCategory(locale, category)}
            </h1>
            <p className="text-muted-foreground mt-2">
              {filtered.length} {filtered.length === 1 ? t.piece : t.pieces} {t.available}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-10">
            <aside
              className={`lg:w-60 flex-shrink-0 ${
                filtersOpen ? "block" : "hidden lg:block"
              }`}
            >
              <div className="sticky top-24 space-y-8">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                    {t.category}
                  </h3>
                  <ul className="space-y-2">
                    {CATEGORIES.map((cat) => (
                      <li key={cat}>
                        <button
                          onClick={() => setCategory(cat)}
                          className={`text-sm w-full text-left py-1 transition-colors ${
                            category === cat
                              ? "font-semibold text-accent"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {translateCategory(locale, cat)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                    {t.maxPrice}
                  </h3>
                  <input
                    type="range"
                    min={100}
                    max={5000}
                    step={100}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <p className="text-sm font-medium text-foreground mt-2">
                    {t.upTo} ${maxPrice.toLocaleString()}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                    {t.offers}
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saleOnly}
                      onChange={(e) => setSaleOnly(e.target.checked)}
                      className="accent-accent w-4 h-4"
                    />
                    <span className="text-sm text-foreground">{t.saleOnly}</span>
                  </label>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6 gap-4">
                <button
                  className="lg:hidden flex items-center gap-2 text-sm font-medium text-muted-foreground border border-border px-3 py-2 rounded hover:border-foreground transition-colors"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {t.filters}
                </button>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="ml-auto bg-card border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {isBootstrapping && products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="font-serif text-2xl text-foreground">{t.loadingTitle}</p>
                  <p className="text-muted-foreground mt-2">{t.loadingText}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="font-serif text-2xl text-foreground">{t.noProducts}</p>
                  <p className="text-muted-foreground mt-2">{t.adjustFilters}</p>
                  <button
                    onClick={() => {
                      setCategory("All");
                      setSaleOnly(false);
                      setMaxPrice(5000);
                    }}
                    className="mt-4 flex items-center gap-1.5 text-sm text-accent hover:underline"
                  >
                    <X className="w-4 h-4" /> {t.clearFilters}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ShopPage() {
  const locale = usePreferences((s) => s.locale);
  const loadingText = locale === "ru" ? "Загрузка..." : "Loading...";

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">{loadingText}</p></div>}>
      <ShopContent />
    </Suspense>
  );
}
