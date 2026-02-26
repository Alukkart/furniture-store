"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Clock,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminDashboardPage() {
  const products = useStore((s) => s.products);
  const orders = useStore((s) => s.orders);
  const auditLogs = useStore((s) => s.auditLogs);

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);

    const pendingOrders = orders.filter(
      (o) => o.status === "pending" || o.status === "processing"
    ).length;

    const lowStockProducts = products.filter((p) => p.stock <= 10);

    const totalProducts = products.length;

    return { totalRevenue, pendingOrders, lowStockProducts, totalProducts };
  }, [products, orders]);

  const recentOrders = orders.slice(0, 5);
  const recentLogs = auditLogs.slice(0, 4);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, Administrator. Here's what's happening today.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[
            {
              label: "Total Revenue",
              value: `$${stats.totalRevenue.toLocaleString()}`,
              icon: DollarSign,
              change: "+12.5%",
              positive: true,
              color: "bg-green-50 text-green-600",
            },
            {
              label: "Total Orders",
              value: orders.length,
              icon: ShoppingBag,
              change: `${stats.pendingOrders} pending`,
              positive: null,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Products",
              value: stats.totalProducts,
              icon: Package,
              change: `${stats.lowStockProducts.length} low stock`,
              positive: stats.lowStockProducts.length === 0,
              color: "bg-purple-50 text-purple-600",
            },
            {
              label: "Avg. Order Value",
              value: `$${Math.round(
                orders.reduce((s, o) => s + o.total, 0) / Math.max(orders.length, 1)
              ).toLocaleString()}`,
              icon: TrendingUp,
              change: "+8.2%",
              positive: true,
              color: "bg-orange-50 text-orange-600",
            },
          ].map(({ label, value, icon: Icon, change, positive, color }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">{value}</p>
              <p
                className={cn(
                  "text-xs mt-1.5 font-medium",
                  positive === true
                    ? "text-green-600"
                    : positive === false
                    ? "text-red-500"
                    : "text-muted-foreground"
                )}
              >
                {change}
              </p>
            </div>
          ))}
        </div>

        {/* Low Stock Alert */}
        {stats.lowStockProducts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800">
                {stats.lowStockProducts.length} product{stats.lowStockProducts.length > 1 ? "s" : ""} running low on stock
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                {stats.lowStockProducts.map((p) => p.name).join(", ")}
              </p>
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs font-medium text-yellow-700 hover:underline flex-shrink-0"
            >
              Manage →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Recent Orders</h2>
              <Link
                href="/admin/orders"
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {order.customer}
                    </p>
                    <p className="text-xs text-muted-foreground">{order.id} · {formatDate(order.date)}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-full capitalize",
                        statusColors[order.status]
                      )}
                    >
                      {order.status}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      ${order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Recent Activity</h2>
              <Link
                href="/admin/audit-log"
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-border">
              {recentLogs.map((log) => (
                <div key={log.id} className="px-6 py-4 flex items-start gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                      log.severity === "critical"
                        ? "bg-red-500"
                        : log.severity === "warning"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
