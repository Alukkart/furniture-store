"use client";

import { useState, useMemo } from "react";
import {
  Search,
  X,
  Filter,
  ScrollText,
  ShieldAlert,
  AlertTriangle,
  Info,
  Package,
  ShoppingBag,
  User,
  Monitor,
  Clock,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { usePreferences } from "@/lib/preferences";
import { adminText, translateAuditRelative } from "@/lib/admin-i18n";
import { useStore, type AuditLog } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function AuditLogPage() {
  const auditLogs = useStore((s) => s.auditLogs);
  const isBootstrapping = useStore((s) => s.isBootstrapping);
  const locale = usePreferences((s) => s.locale);
  const t = adminText[locale].audit;

  const severityConfig = {
    info: { icon: Info, dot: "bg-green-500", badge: "bg-green-50 text-green-700 border-green-200", label: t.info },
    warning: { icon: AlertTriangle, dot: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700 border-yellow-200", label: t.warning },
    critical: { icon: ShieldAlert, dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200", label: t.critical },
  };

  const categoryConfig = {
    product: { icon: Package, color: "text-blue-600 bg-blue-50", label: t.product },
    order: { icon: ShoppingBag, color: "text-purple-600 bg-purple-50", label: t.order },
    user: { icon: User, color: "text-orange-600 bg-orange-50", label: t.user },
    system: { icon: Monitor, color: "text-gray-600 bg-gray-100", label: t.system },
  };

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<AuditLog["severity"] | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<AuditLog["category"] | "all">("all");

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.user.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = severityFilter === "all" || log.severity === severityFilter;
      const matchCategory = categoryFilter === "all" || log.category === categoryFilter;
      return matchSearch && matchSeverity && matchCategory;
    });
  }, [auditLogs, search, severityFilter, categoryFilter]);

  const counts = useMemo(
    () => ({
      info: auditLogs.filter((l) => l.severity === "info").length,
      warning: auditLogs.filter((l) => l.severity === "warning").length,
      critical: auditLogs.filter((l) => l.severity === "critical").length,
    }),
    [auditLogs]
  );

  const hasFilters = search || severityFilter !== "all" || categoryFilter !== "all";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["info", "warning", "critical"] as const).map((sev) => {
            const config = severityConfig[sev];
            const Icon = config.icon;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(severityFilter === sev ? "all" : sev)}
                className={cn(
                  "bg-card border rounded-xl p-5 text-left flex items-center gap-4 transition-all",
                  severityFilter === sev
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", sev === "info" ? "bg-green-50 text-green-600" : sev === "warning" ? "bg-yellow-50 text-yellow-600" : "bg-red-50 text-red-600")}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts[sev]}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{config.label} {t.events}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-52 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-input rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as AuditLog["category"] | "all")} className="border border-input rounded-lg px-3 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="all">{t.allCategories}</option>
              <option value="product">{t.product}</option>
              <option value="order">{t.order}</option>
              <option value="user">{t.user}</option>
              <option value="system">{t.system}</option>
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setSeverityFilter("all");
                setCategoryFilter("all");
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" /> {t.clearAll}
            </button>
          )}

          <p className="text-sm text-muted-foreground ml-auto">
            {filtered.length} {t.event}{filtered.length === 1 ? "" : locale === "ru" ? "й" : "s"}
          </p>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-xl text-center py-16 text-muted-foreground">
              <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{isBootstrapping ? t.loading : t.empty}</p>
            </div>
          ) : (
            filtered.map((log) => {
              const date = new Date(log.timestamp);
              const sevConfig = severityConfig[log.severity];
              const catConfig = categoryConfig[log.category];
              const CatIcon = catConfig.icon;

              return (
                <div key={log.id} className="bg-card border border-border rounded-xl px-5 py-4 flex items-start gap-4 hover:border-muted-foreground/40 transition-colors">
                  <div className="flex items-center justify-center pt-1.5 flex-shrink-0">
                    <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", sevConfig.dot)} />
                  </div>

                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", catConfig.color)}>
                    <CatIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                      <p className="font-semibold text-sm text-foreground">{log.action}</p>
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", sevConfig.badge)}>{sevConfig.label}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{catConfig.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{log.details}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.user}
                      </span>
                      <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span title={date.toLocaleString(locale === "ru" ? "ru-RU" : "en-US")}>
                          {date.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US")} {t.at} {date.toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-US")}
                        </span>
                        <span className="text-muted-foreground/40">· {translateAuditRelative(locale, Date.now() - date.getTime())}</span>
                      </span>
                      <span className="text-xs text-muted-foreground/40 font-mono">#{log.id}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
