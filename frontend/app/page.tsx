"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, Truck, RotateCcw, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { usePreferences } from "@/lib/preferences";
import { siteText, translateCategory } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const categories = [
  {
    name: "Living Room",
    image: "/images/cat-living.jpg",
    count: 24,
    href: "/shop?category=Living Room",
  },
  {
    name: "Bedroom",
    image: "/images/cat-bedroom.jpg",
    count: 18,
    href: "/shop?category=Bedroom",
  },
  {
    name: "Dining Room",
    image: "/images/cat-dining.jpg",
    count: 15,
    href: "/shop?category=Dining Room",
  },
  {
    name: "Home Office",
    image: "/images/cat-office.jpg",
    count: 12,
    href: "/shop?category=Home Office",
  },
];

export default function HomePage() {
  const products = useStore((s) => s.products);
  const isBootstrapping = useStore((s) => s.isBootstrapping);
  const locale = usePreferences((s) => s.locale);
  const t = siteText[locale].home;
  const featuredProducts = products.filter((p) => p.featured);
  const perks = [
    {
      icon: Truck,
      title: t.perks.freeDelivery,
      desc: t.perks.freeDeliveryDesc,
    },
    {
      icon: RotateCcw,
      title: t.perks.returns,
      desc: t.perks.returnsDesc,
    },
    {
      icon: Shield,
      title: t.perks.warranty,
      desc: t.perks.warrantyDesc,
    },
    {
      icon: Star,
      title: t.perks.curation,
      desc: t.perks.curationDesc,
    },
  ];
  const testimonials =
    locale === "ru"
      ? [
          {
            name: "Сара М.",
            role: "Дизайнер интерьеров",
            review:
              "Диван Haven выглядит великолепно. Качество заметно выше всего, что я встречала в этом ценовом сегменте. Клиенты всегда остаются под впечатлением.",
          },
          {
            name: "Джеймс Т.",
            role: "Владелец дома",
            review:
              "Доставка прошла безупречно, а стол Strata приехал в идеальном состоянии. Качество материалов чувствуется сразу. Полностью оправдывает цену.",
          },
          {
            name: "Елена Р.",
            role: "Архитектор",
            review:
              "Я обставила уже три проекта мебелью Maison & Co., и клиенты остались очень довольны. Стабильное качество и команда, которой действительно не все равно.",
          },
        ]
      : [
          {
            name: "Sarah M.",
            role: "Interior Designer",
            review:
              "The Haven Sectional is absolutely stunning. The quality far exceeds anything I've found at a similar price point. My clients are always impressed.",
          },
          {
            name: "James T.",
            role: "Homeowner",
            review:
              "Delivery was seamless and the Strata dining table arrived in perfect condition. The craftsmanship is evident the moment you touch it. Worth every penny.",
          },
          {
            name: "Elena R.",
            role: "Architect",
            review:
              "I've furnished three projects with Maison & Co. pieces and my clients have never been happier. Consistent quality and a team that genuinely cares.",
          },
        ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="relative h-[70vh] md:h-[85vh] overflow-hidden">
          <Image
            src="/images/hero-sofa.jpg"
            alt="Elegant modern living room"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-foreground/35" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
              <div className="max-w-xl">
                <p className="text-primary-foreground/70 text-sm uppercase tracking-widest font-medium mb-4">
                  {t.collection}
                </p>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight text-balance">
                  {t.heroTitle}
                </h1>
                <p className="mt-5 text-primary-foreground/80 text-lg leading-relaxed max-w-md">
                  {t.heroText}
                </p>
                <div className="flex flex-wrap gap-4 mt-8">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 bg-primary-foreground text-foreground px-7 py-3.5 rounded font-medium hover:opacity-90 transition-opacity"
                  >
                    {t.shopNow} <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/shop?category=Living Room"
                    className="inline-flex items-center gap-2 border border-primary-foreground/50 text-primary-foreground px-7 py-3.5 rounded font-medium hover:bg-primary-foreground/10 transition-colors"
                  >
                    {t.viewCollections}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-secondary border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {perks.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
                {t.explore}
              </p>
              <h2 className="font-serif text-4xl font-bold text-foreground text-balance">
                {t.shopByRoom}
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden md:flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4"
            >
              {t.viewAll} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg"
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-serif text-xl font-bold text-primary-foreground">
                    {translateCategory(locale, cat.name)}
                  </h3>
                  <p className="text-sm text-primary-foreground/70 mt-0.5">
                    {cat.count} {t.pieces}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 md:hidden text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent"
            >
              {t.viewAll} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="bg-muted py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
                  {t.handPicked}
                </p>
                <h2 className="font-serif text-4xl font-bold text-foreground text-balance">
                  {t.featuredPieces}
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden md:flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4"
              >
                {t.viewAll} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isBootstrapping && featuredProducts.length === 0 ? (
                <p className="col-span-full text-sm text-muted-foreground">
                  {t.loadingProducts}
                </p>
              ) : (
                featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </section>

        <section className="relative h-80 md:h-96 overflow-hidden">
          <Image
            src="/images/cat-living.jpg"
            alt="Interior design inspiration"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-foreground/60" />
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div className="max-w-2xl px-4">
              <p className="text-primary-foreground/70 text-sm uppercase tracking-widest mb-3">
                {t.limitedTime}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground text-balance">
                {t.saleTitle}
              </h2>
              <p className="text-primary-foreground/70 mt-4 text-lg">
                {t.saleText}
              </p>
              <Link
                href="/shop?sale=true"
                className="inline-flex items-center gap-2 mt-7 bg-accent text-accent-foreground px-8 py-3.5 rounded font-medium hover:opacity-90 transition-opacity"
              >
                {t.shopSale} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">
              {t.testimonialsLead}
            </p>
            <h2 className="font-serif text-4xl font-bold text-foreground">
              {t.testimonialsTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((entry) => (
              <div key={entry.name} className="bg-card border border-border rounded-lg p-7">
                <p className="text-foreground/80 leading-relaxed text-sm italic">
                  "{entry.review}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {entry.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">{entry.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
