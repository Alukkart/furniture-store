"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePreferences } from "@/lib/preferences";
import { siteText } from "@/lib/i18n";

type InfoSlug =
  | "about"
  | "sustainability"
  | "careers"
  | "press"
  | "faq"
  | "shipping"
  | "care"
  | "contact"
  | "privacy"
  | "terms"
  | "cookies";

type Props = {
  params: Promise<{ slug: InfoSlug }>;
};

export default function InfoPage({ params }: Props) {
  const { slug } = use(params);
  const locale = usePreferences((s) => s.locale);
  const infoPage = siteText[locale].infoPages[slug];
  const backLabel = siteText[locale].register.back;

  if (!infoPage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <article className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {infoPage.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {infoPage.eyebrow}
            </p>
          ) : null}
          <h1 className="font-serif text-4xl font-bold text-foreground">{infoPage.title}</h1>
          <p className="mt-6 text-base leading-7 text-muted-foreground">{infoPage.body}</p>

          {infoPage.highlights?.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {infoPage.highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/80 bg-background px-4 py-4 text-sm leading-6 text-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          ) : null}

          {infoPage.sections?.length ? (
            <div className="mt-10 space-y-8">
              {infoPage.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="font-serif text-2xl font-semibold text-foreground">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-base leading-7 text-muted-foreground">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
          ) : null}

          {infoPage.note ? (
            <div className="mt-10 rounded-2xl bg-secondary px-5 py-4 text-sm leading-6 text-secondary-foreground">
              {infoPage.note}
            </div>
          ) : null}
        </article>
      </main>
      <Footer />
    </div>
  );
}
