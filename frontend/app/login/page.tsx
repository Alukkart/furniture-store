"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const { login, loginError, currentUser } = useAuth();
  const router = useRouter();

  // Already logged in — redirect straight to admin
  useEffect(() => {
    if (currentUser) {
      router.replace("/admin");
    }
  }, [currentUser, router]);

  function validate() {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
    if (!password) errors.password = "Password is required.";
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    const success = await login(email, password);

    if (success) {
      router.push("/admin");
    }

    setIsLoading(false);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left — Decorative Panel */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-sofa.jpg"
            alt="Maison & Co. interior"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-primary/70" />
        </div>
        <div className="relative z-10 p-12">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg flex items-center justify-center">
              <span className="font-serif font-bold text-primary-foreground text-lg">M</span>
            </div>
            <div>
              <p className="font-serif font-bold text-primary-foreground text-lg leading-tight">
                Maison & Co.
              </p>
              <p className="text-xs text-primary-foreground/60">Admin Portal</p>
            </div>
          </Link>
        </div>
        <div className="relative z-10 p-12 space-y-6">
          <blockquote className="space-y-3">
            <p className="font-serif text-3xl font-medium text-primary-foreground leading-snug text-pretty">
              "Design is not just what it looks like and feels like. Design is how it works."
            </p>
            <cite className="text-sm text-primary-foreground/60 not-italic">— Steve Jobs</cite>
          </blockquote>
          <div className="border-t border-primary-foreground/20 pt-6">
            <p className="text-sm text-primary-foreground/70">
              Manage your store, track inventory, and monitor all administrative actions — all in one place.
            </p>
          </div>
        </div>
        <div className="relative z-10 p-12">
          <div className="flex gap-1.5">
            <div className="w-8 h-1 rounded-full bg-primary-foreground" />
            <div className="w-4 h-1 rounded-full bg-primary-foreground/30" />
            <div className="w-4 h-1 rounded-full bg-primary-foreground/30" />
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <span className="font-serif font-bold text-primary-foreground">M</span>
            </div>
            <span className="font-serif font-bold text-foreground text-xl">Maison & Co.</span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-8">
          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="font-serif text-3xl font-bold text-foreground text-balance">
              Welcome back
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to your admin account to continue.
            </p>
          </div>

          {/* Demo credentials hint */}
          <div className="rounded-lg bg-secondary border border-border px-4 py-3">
            <p className="text-xs font-semibold text-foreground mb-1.5">Demo credentials</p>
            <div className="space-y-0.5 text-xs text-muted-foreground font-mono">
              <p>admin@maison.co / admin123</p>
              <p>manager@maison.co / manager123</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Global error */}
            {loginError && !isLoading && (
              <div className="flex items-center gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive font-medium">{loginError}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="admin@maison.co"
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm outline-none transition-all",
                    "focus:ring-2 focus:ring-ring focus:border-transparent",
                    fieldErrors.email
                      ? "border-destructive ring-1 ring-destructive"
                      : "border-input"
                  )}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={cn(
                    "w-full pl-10 pr-11 py-2.5 rounded-lg border bg-card text-foreground placeholder:text-muted-foreground/50 text-sm outline-none transition-all",
                    "focus:ring-2 focus:ring-ring focus:border-transparent",
                    fieldErrors.password
                      ? "border-destructive ring-1 ring-destructive"
                      : "border-input"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-all",
                isLoading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:opacity-90 active:scale-[0.99]"
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Back to store */}
          <div className="pt-2 border-t border-border">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to storefront
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
