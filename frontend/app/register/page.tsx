"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import { siteText } from "@/lib/i18n";
import { signupClient } from "@/services/auth";
import { useAuth } from "@/lib/auth";
import { getApiErrorMessage, isDuplicateEmailError } from "@/services/http";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const locale = usePreferences((s) => s.locale);
  const t = siteText[locale].register;
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError(t.required);
      return;
    }
    if (form.password.length < 6) {
      setError(t.passwordLength);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await signupClient(form.email, form.password, form.name);
      await login(form.email, form.password);
      router.push("/account/orders");
    } catch (signupError) {
      setError(
        isDuplicateEmailError(signupError)
          ? t.emailTaken
          : getApiErrorMessage(signupError, t.createFailed)
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-3 text-accent">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-foreground">{t.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.subtitle}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.fullName}</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.email}</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.password}</span>
              <input
                required
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.confirm}</span>
              <input
                required
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? t.creating : t.create}
            </button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            {t.already}{" "}
            <Link href="/login" className="font-medium text-accent hover:opacity-80 transition-opacity">
              {t.signIn}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
