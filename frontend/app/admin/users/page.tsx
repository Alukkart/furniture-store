"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Shield, UserPlus, X } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { usePreferences } from "@/lib/preferences";
import { adminText, translateAdminRole } from "@/lib/admin-i18n";
import type { RoleName } from "@/lib/types";
import { createUser, listUsers, setUserBlocked, type UserRecord } from "@/services/users";
import { getApiErrorMessage } from "@/services/http";

const ROLE_OPTIONS: RoleName[] = ["Administrator", "Manager", "Warehouse", "Executive"];

export default function UsersPage() {
  const locale = usePreferences((s) => s.locale);
  const t = adminText[locale].users;
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Manager" as RoleName,
  });

  async function loadUsers() {
    setIsLoading(true);
    try {
      const data = await listUsers();
      setUsers(data);
      setError(null);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, t.failedLoad));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const term = search.toLowerCase();
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.name.toLowerCase().includes(term)
      );
    });
  }, [search, users]);

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await createUser(form);
      setForm({ name: "", email: "", password: "", role: "Manager" });
      await loadUsers();
    } catch (createError) {
      setError(getApiErrorMessage(createError, t.failedCreate));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.subtitle}</p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-accent" />
              <h2 className="font-semibold text-foreground">{t.registerUser}</h2>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
              <label className="space-y-1.5 block">
                <span className="text-sm font-medium text-foreground">{t.name}</span>
                <input required value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
              </label>
              <label className="space-y-1.5 block">
                <span className="text-sm font-medium text-foreground">{t.email}</span>
                <input required type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
              </label>
              <label className="space-y-1.5 block">
                <span className="text-sm font-medium text-foreground">{t.password}</span>
                <input required type="password" value={form.password} onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground" />
              </label>
              <label className="space-y-1.5 block">
                <span className="text-sm font-medium text-foreground">{t.role}</span>
                <select value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as RoleName }))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground">
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{translateAdminRole(locale, role)}</option>
                  ))}
                </select>
              </label>

              <button type="submit" disabled={isSubmitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? t.creating : t.createUser}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                <h2 className="font-semibold text-foreground">{t.accessControl}</h2>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-9 text-sm text-foreground" />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">{t.loading}</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.empty}</p>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t.rolePrefix}: {translateAdminRole(locale, user.role.name)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await setUserBlocked(user.id, !user.is_blocked);
                          await loadUsers();
                        } catch (toggleError) {
                          setError(getApiErrorMessage(toggleError, t.failedToggle));
                        }
                      }}
                      className={`rounded-lg px-3 py-2 text-xs font-medium ${
                        user.is_blocked ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}
                    >
                      {user.is_blocked ? t.unblock : t.block}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
