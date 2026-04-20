"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import { siteText } from "@/lib/i18n";
import { signupClient } from "@/services/auth";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  isValidEmail,
  isValidRussianFullName,
  normalizeEmail,
  normalizeRussianName,
  sanitizeRussianNameInput,
} from "@/lib/validation";
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
  const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).+$/;
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const normalizedName = normalizeRussianName(form.name);
    const normalizedEmail = normalizeEmail(form.email);
    const nextErrors: typeof fieldErrors = {};

    if (!normalizedName) nextErrors.name = t.required;
    else if (!isValidRussianFullName(normalizedName)) nextErrors.name = t.invalidName;

    if (!normalizedEmail) nextErrors.email = t.required;
    else if (!isValidEmail(normalizedEmail)) nextErrors.email = t.invalidEmail;

    if (!form.password) nextErrors.password = t.required;
    else if (form.password.length < 6) nextErrors.password = t.passwordLength;
    else if (!passwordPattern.test(form.password)) nextErrors.password = t.passwordComplexity;

    if (!form.confirmPassword) nextErrors.confirmPassword = t.required;
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = t.passwordMismatch;

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError(Object.values(nextErrors)[0] ?? t.required);
      return;
    }

    setFieldErrors({});

    setIsSubmitting(true);
    try {
      await signupClient(normalizedEmail, form.password, normalizedName);
      await login(normalizedEmail, form.password);
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
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: sanitizeRussianNameInput(event.target.value) }));
                  if (fieldErrors.name) setFieldErrors((current) => ({ ...current, name: undefined }));
                }}
                placeholder={locale === "ru" ? "Иванов Иван Иванович" : "Ivanov Ivan Ivanovich"}
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground",
                  fieldErrors.name ? "border-destructive" : "border-input"
                )}
              />
              {fieldErrors.name && <span className="text-xs text-destructive">{fieldErrors.name}</span>}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.email}</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => {
                  setForm((current) => ({ ...current, email: event.target.value }));
                  if (fieldErrors.email) setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground",
                  fieldErrors.email ? "border-destructive" : "border-input"
                )}
              />
              {fieldErrors.email && <span className="text-xs text-destructive">{fieldErrors.email}</span>}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.password}</span>
              <input
                required
                type="password"
                value={form.password}
                onChange={(event) => {
                  setForm((current) => ({ ...current, password: event.target.value }));
                  if (fieldErrors.password) setFieldErrors((current) => ({ ...current, password: undefined }));
                }}
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground",
                  fieldErrors.password ? "border-destructive" : "border-input"
                )}
              />
              {fieldErrors.password && <span className="text-xs text-destructive">{fieldErrors.password}</span>}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">{t.confirm}</span>
              <input
                required
                type="password"
                value={form.confirmPassword}
                onChange={(event) => {
                  setForm((current) => ({ ...current, confirmPassword: event.target.value }));
                  if (fieldErrors.confirmPassword) setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                }}
                className={cn(
                  "w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground",
                  fieldErrors.confirmPassword ? "border-destructive" : "border-input"
                )}
              />
              {fieldErrors.confirmPassword && <span className="text-xs text-destructive">{fieldErrors.confirmPassword}</span>}
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
