"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { Search, X, ChevronDown, ShoppingBag } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { usePreferences } from "@/lib/preferences";
import { adminText, translateOrderStatus } from "@/lib/admin-i18n";
import { useStore, type Order } from "@/lib/store";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: Order["status"][] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const statusColors: Record<Order["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const orders = useStore((s) => s.orders);
  const isBootstrapping = useStore((s) => s.isBootstrapping);
  const updateOrderStatus = useStore((s) => s.updateOrderStatus);
  const locale = usePreferences((s) => s.locale);
  const t = adminText[locale].orders;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATUS_OPTIONS.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                className={cn(
                  "bg-card border rounded-xl p-4 text-left transition-all",
                  statusFilter === s
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full mt-1.5 inline-block", statusColors[s])}>
                  {translateOrderStatus(locale, s)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-52 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.search}
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

          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" /> {t.clearFilter}
            </button>
          )}

          <p className="text-sm text-muted-foreground ml-auto">
            {filtered.length} {filtered.length === 1 ? t.order : t.orders} · {t.revenue}:{" "}
            <span className="font-semibold text-foreground">${totalRevenue.toLocaleString()}</span>
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.tableOrder}</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t.tableCustomer}</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t.tableDate}</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.tableTotal}</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.tableStatus}</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.tableActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => (
                  <Fragment key={order.id}>
                    <tr
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform flex-shrink-0", expandedId === order.id && "rotate-180")} />
                          <code className="text-xs font-mono text-foreground">{order.id}</code>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div>
                          <p className="font-medium text-foreground">{order.customer}</p>
                          <p className="text-xs text-muted-foreground">{order.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-muted-foreground">
                        {new Date(order.date).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US")}
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">${order.total.toLocaleString()}</td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={async (e) => {
                            setUpdatingOrderId(order.id);
                            await updateOrderStatus(order.id, e.target.value as Order["status"]);
                            setUpdatingOrderId(null);
                          }}
                          disabled={updatingOrderId === order.id}
                          className={cn("text-xs font-medium px-2 py-1.5 rounded-full cursor-pointer focus:outline-none border-0 appearance-none", statusColors[order.status])}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{translateOrderStatus(locale, s)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div
                          className="flex items-center justify-end gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-xs font-medium text-foreground hover:text-accent transition-colors"
                          >
                            {t.edit}
                          </Link>
                          <button
                            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            className="text-xs text-accent hover:underline"
                          >
                            {expandedId === order.id ? t.hide : t.details}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedId === order.id && (
                      <tr className="bg-secondary">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t.orderItems}</p>
                              <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-4 bg-card rounded-lg px-4 py-2.5 border border-border">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {t.qty}: {item.quantity} · ${item.product.price.toLocaleString()} {t.each}
                                      </p>
                                    </div>
                                    <p className="text-sm font-semibold text-foreground flex-shrink-0">
                                      ${(item.product.price * item.quantity).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t.deliveryDetails}</p>
                              <div className="bg-card border border-border rounded-lg px-4 py-3 space-y-2">
                                <div className="flex gap-2">
                                  <p className="text-xs text-muted-foreground w-20 flex-shrink-0">{t.customer}</p>
                                  <p className="text-xs font-medium text-foreground">{order.customer}</p>
                                </div>
                                <div className="flex gap-2">
                                  <p className="text-xs text-muted-foreground w-20 flex-shrink-0">{t.email}</p>
                                  <p className="text-xs font-medium text-foreground">{order.email}</p>
                                </div>
                                <div className="flex gap-2">
                                  <p className="text-xs text-muted-foreground w-20 flex-shrink-0">{t.address}</p>
                                  <p className="text-xs font-medium text-foreground">{order.address}</p>
                                </div>
                                <div className="flex gap-2">
                                  <p className="text-xs text-muted-foreground w-20 flex-shrink-0">{t.date}</p>
                                  <p className="text-xs font-medium text-foreground">{new Date(order.date).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US")}</p>
                                </div>
                                <div className="flex gap-2 pt-1 border-t border-border mt-1">
                                  <p className="text-xs text-muted-foreground w-20 flex-shrink-0">{t.total}</p>
                                  <p className="text-xs font-bold text-foreground">${order.total.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>{isBootstrapping ? t.loading : t.empty}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
