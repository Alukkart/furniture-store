"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Product,
  type CartItem,
  type Order,
  type AuditLog,
  PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_LOGS,
} from "./data";

// Re-export types and data so existing imports from "@/lib/store" keep working
export type { Product, CartItem, Order, AuditLog };
export { PRODUCTS, INITIAL_ORDERS, INITIAL_LOGS };

type StoreState = {
  cart: CartItem[];
  products: Product[];
  orders: Order[];
  auditLogs: AuditLog[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  updateProduct: (product: Product, adminUser?: string) => void;
  updateOrderStatus: (orderId: string, status: Order["status"], adminUser?: string) => void;
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => void;
  placeOrder: (customer: string, email: string, address: string) => Order | null;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      products: PRODUCTS,
      orders: INITIAL_ORDERS,
      auditLogs: INITIAL_LOGS,

      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existing = state.cart.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { cart: [...state.cart, { product, quantity }] };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((i) => i.product.id !== productId),
        }));
      },

      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          cart: state.cart.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ cart: [] }),

      updateProduct: (product, adminUser = "admin@maison.co") => {
        const prev = get().products.find((p) => p.id === product.id);
        set((state) => ({
          products: state.products.map((p) => (p.id === product.id ? product : p)),
        }));
        const changes: string[] = [];
        if (prev) {
          if (prev.price !== product.price)
            changes.push(`price: $${prev.price} → $${product.price}`);
          if (prev.stock !== product.stock)
            changes.push(`stock: ${prev.stock} → ${product.stock}`);
          if (prev.name !== product.name)
            changes.push(`name: "${prev.name}" → "${product.name}"`);
        }
        get().addAuditLog({
          action: "Product Updated",
          category: "product",
          user: adminUser,
          details: `Updated "${product.name}"${changes.length ? ": " + changes.join(", ") : ""}`,
          severity: "info",
        });
      },

      updateOrderStatus: (orderId, status, adminUser = "admin@maison.co") => {
        const prev = get().orders.find((o) => o.id === orderId);
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status } : o
          ),
        }));
        get().addAuditLog({
          action: "Order Status Changed",
          category: "order",
          user: adminUser,
          details: `Order ${orderId} status changed from '${prev?.status}' to '${status}'`,
          severity: status === "cancelled" ? "warning" : "info",
        });
      },

      addAuditLog: (log) => {
        const newLog: AuditLog = {
          ...log,
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
      },

      placeOrder: (customer, email, address) => {
        const cart = get().cart;
        if (cart.length === 0) return null;
        const total = cart.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
        const order: Order = {
          id: `ORD-${Date.now()}`,
          customer,
          email,
          items: [...cart],
          total,
          status: "pending",
          date: new Date().toISOString(),
          address,
        };
        set((state) => ({ orders: [order, ...state.orders] }));
        get().clearCart();
        get().addAuditLog({
          action: "New Order Placed",
          category: "order",
          user: email,
          details: `New order ${order.id} placed by ${customer} — $${total.toLocaleString()}`,
          severity: "info",
        });
        return order;
      },
    }),
    {
      name: "maison-store",
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
