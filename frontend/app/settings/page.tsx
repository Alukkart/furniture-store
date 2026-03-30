"use client";

import Link from "next/link";
import { ArrowLeft, MonitorCog, Moon, Sun, Laptop } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePreferences, type DensityMode, type ThemeMode, type SiteLocale } from "@/lib/preferences";
import { siteText } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const THEMES: { value: ThemeMode; label: "light" | "dark" | "system"; icon: typeof Sun }[] = [
  { value: "light", label: "light", icon: Sun },
  { value: "dark", label: "dark", icon: Moon },
  { value: "system", label: "system", icon: Laptop },
];

const DENSITIES: { value: DensityMode; label: "comfortable" | "compact"; description: "comfortableDesc" | "compactDesc" }[] = [
  { value: "comfortable", label: "comfortable", description: "comfortableDesc" },
  { value: "compact", label: "compact", description: "compactDesc" },
];

const LANGUAGES: { value: SiteLocale; label: "english" | "russian" }[] = [
  { value: "en", label: "english" },
  { value: "ru", label: "russian" },
];

export default function SettingsPage() {
  const locale = usePreferences((s) => s.locale);
  const theme = usePreferences((s) => s.theme);
  const density = usePreferences((s) => s.density);
  const setLocale = usePreferences((s) => s.setLocale);
  const setTheme = usePreferences((s) => s.setTheme);
  const setDensity = usePreferences((s) => s.setDensity);
  const t = siteText[locale].settings;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-3 text-accent">
              <MonitorCog className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">{t.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.subtitle}
              </p>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t.theme}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {THEMES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    "rounded-xl border px-4 py-4 text-left transition-colors",
                    theme === value ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  )}
                >
                  <Icon className="h-5 w-5 text-accent" />
                  <p className="mt-3 font-medium text-foreground">{t[label]}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t.density}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {DENSITIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDensity(option.value)}
                  className={cn(
                    "rounded-xl border px-4 py-4 text-left transition-colors",
                    density === option.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  )}
                >
                  <p className="font-medium text-foreground">{t[option.label]}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t[option.description]}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t.language}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {LANGUAGES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLocale(option.value)}
                  className={cn(
                    "rounded-xl border px-4 py-4 text-left transition-colors",
                    locale === option.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
                  )}
                >
                  <p className="font-medium text-foreground">{t[option.label]}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
