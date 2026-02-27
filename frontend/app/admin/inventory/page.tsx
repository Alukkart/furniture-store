"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  Edit2,
  X,
  Save,
  Package,
  AlertTriangle,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useStore, type Product } from "@/lib/store";
import { cn } from "@/lib/utils";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        Out of Stock
      </span>
    );
  if (stock <= 10)
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
        Low: {stock}
      </span>
    );
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
      {stock} units
    </span>
  );
}

export default function InventoryPage() {
  const products = useStore((s) => s.products);
  const isBootstrapping = useStore((s) => s.isBootstrapping);
  const updateProduct = useStore((s) => s.updateProduct);

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (editingId && editForm) {
      const original = products.find((p) => p.id === editingId);
      if (original) {
        setIsSaving(true);
        await updateProduct({ ...original, ...editForm } as Product);
        setIsSaving(false);
      }
    }
    setEditingId(null);
    setEditForm({});
  };

  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= 10).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground mt-1">
              Manage product listings, pricing, and stock levels.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Products",
              value: products.length,
              icon: Package,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Inventory Value",
              value: `$${totalValue.toLocaleString()}`,
              icon: Package,
              color: "bg-green-50 text-green-600",
            },
            {
              label: "Low Stock Alerts",
              value: lowStockCount,
              icon: AlertTriangle,
              color: lowStockCount > 0 ? "bg-yellow-50 text-yellow-600" : "bg-gray-50 text-gray-500",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-2xl font-bold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, category, or SKU..."
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

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    SKU
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Category
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product) => {
                  const isEditing = editingId === product.id;
                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isEditing && "bg-secondary"
                      )}
                    >
                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            {isEditing ? (
                              <input
                                value={editForm.name ?? product.name}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, name: e.target.value }))
                                }
                                className="w-full border border-input rounded px-2 py-1 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                            ) : (
                              <p className="font-medium text-foreground truncate max-w-xs">
                                {product.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {product.sku}
                        </code>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.price ?? product.price}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, price: Number(e.target.value) }))
                            }
                            className="w-28 border border-input rounded px-2 py-1 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        ) : (
                          <span className="font-semibold text-foreground">
                            ${product.price.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.stock ?? product.stock}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, stock: Number(e.target.value) }))
                            }
                            className="w-20 border border-input rounded px-2 py-1 text-sm bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        ) : (
                          <StockBadge stock={product.stock} />
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="text-muted-foreground">{product.category}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={isSaving}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded hover:opacity-90 transition-opacity"
                            >
                              <Save className="w-3.5 h-3.5" /> {isSaving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground text-xs rounded hover:bg-muted transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(product)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted-foreground text-xs rounded hover:bg-muted transition-colors ml-auto"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>
                  {isBootstrapping
                    ? "Loading products..."
                    : "No products found matching your search."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
