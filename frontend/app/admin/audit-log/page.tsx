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
import { useStore, type AuditLog } from "@/lib/store";
import { cn } from "@/lib/utils";

const severityConfig = {
  info: {
    icon: Info,
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border-green-200",
    label: "Info",
  },
  warning: {
    icon: AlertTriangle,
    dot: "bg-yellow-500",
    badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
    label: "Warning",
  },
  critical: {
    icon: ShieldAlert,
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
    label: "Critical",
  },
};

const categoryConfig = {
  product: {
    icon: Package,
    color: "text-blue-600 bg-blue-50",
    label: "Product",
  },
  order: {
    icon: ShoppingBag,
    color: "text-purple-600 bg-purple-50",
    label: "Order",
  },
  user: {
    icon: User,
    color: "text-orange-600 bg-orange-50",
    label: "User",
  },
  system: {
    icon: Monitor,
    color: "text-gray-600 bg-gray-100",
    label: "System",
  },
};

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    relative: getRelativeTime(date),
  };
}

function getRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function AuditLogPage() {
  const auditLogs = useStore((s) => s.auditLogs);
  const isBootstrapping = useStore((s) => s.isBootstrapping);

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
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground mt-1">
            A complete, tamper-evident record of all administrative actions.
          </p>
        </div>

        {/* Severity Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["info", "warning", "critical"] as const).map((sev) => {
            const config = severityConfig[sev];
            const Icon = config.icon;
            return (
              <button
                key={sev}
                onClick={() =>
                  setSeverityFilter(severityFilter === sev ? "all" : sev)
                }
                className={cn(
                  "bg-card border rounded-xl p-5 text-left flex items-center gap-4 transition-all",
                  severityFilter === sev
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    sev === "info"
                      ? "bg-green-50 text-green-600"
                      : sev === "warning"
                      ? "bg-yellow-50 text-yellow-600"
                      : "bg-red-50 text-red-600"
                  )}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{counts[sev]}</p>
                  <p className="text-xs text-muted-foreground capitalize font-medium mt-0.5">
                    {config.label} events
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-52 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search actions, details, or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-input rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as AuditLog["category"] | "all")}
              className="border border-input rounded-lg px-3 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Categories</option>
              <option value="product">Product</option>
              <option value="order">Order</option>
              <option value="user">User</option>
              <option value="system">System</option>
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
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}

          <p className="text-sm text-muted-foreground ml-auto">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Log Timeline */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-xl text-center py-16 text-muted-foreground">
              <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>
                {isBootstrapping
                  ? "Loading log entries..."
                  : "No log entries match your filters."}
              </p>
            </div>
          ) : (
            filtered.map((log) => {
              const ts = formatTimestamp(log.timestamp);
              const sevConfig = severityConfig[log.severity];
              const catConfig = categoryConfig[log.category];
              const CatIcon = catConfig.icon;

              return (
                <div
                  key={log.id}
                  className="bg-card border border-border rounded-xl px-5 py-4 flex items-start gap-4 hover:border-muted-foreground/40 transition-colors"
                >
                  {/* Severity dot */}
                  <div className="flex items-center justify-center pt-1.5 flex-shrink-0">
                    <div
                      className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", sevConfig.dot)}
                    />
                  </div>

                  {/* Category Icon */}
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      catConfig.color
                    )}
                  >
                    <CatIcon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                      <p className="font-semibold text-sm text-foreground">{log.action}</p>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
                          sevConfig.badge
                        )}
                      >
                        {sevConfig.label}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                        {catConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {log.details}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.user}
                      </span>
                      <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span title={`${ts.date} at ${ts.time}`}>
                          {ts.date} at {ts.time}
                        </span>
                        <span className="text-muted-foreground/40">· {ts.relative}</span>
                      </span>
                      <span className="text-xs text-muted-foreground/40 font-mono">
                        #{log.id}
                      </span>
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
