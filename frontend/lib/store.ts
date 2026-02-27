"use client";

import {create} from "zustand";
import {persist} from "zustand/middleware";
import type {Product, CartItem, Order, AuditLog} from "./types";
import {listProducts, updateProduct as updateProductRequest} from "@/services/products";
import {
    listOrders,
    createOrder as createOrderRequest,
    updateOrderStatus as updateOrderStatusRequest,
} from "@/services/orders";
import {listAuditLogs, createAuditLog as createAuditLogRequest} from "@/services/auditLogs";
import {getApiErrorMessage} from "@/services/http";

export type {Product, CartItem, Order, AuditLog};

type StoreState = {
    cart: CartItem[];
    products: Product[];
    orders: Order[];
    auditLogs: AuditLog[];
    isBootstrapping: boolean;
    bootstrapError: string | null;
    bootstrap: (force?: boolean) => Promise<void>;
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    updateProduct: (product: Product, adminUser?: string) => Promise<Product | null>;
    updateOrderStatus: (
        orderId: string,
        status: Order["status"],
        adminUser?: string
    ) => Promise<Order | null>;
    addAuditLog: (log: Omit<AuditLog, "id" | "timestamp">) => Promise<AuditLog | null>;
    placeOrder: (customer: string, email: string, address: string) => Promise<Order | null>;
};

let bootstrapPromise: Promise<void> | null = null;

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            cart: [],
            products: [],
            orders: [],
            auditLogs: [],
            isBootstrapping: false,
            bootstrapError: null,

            bootstrap: async (force = false) => {
                const shouldSkip =
                    !force &&
                    get().products.length > 0 &&
                    get().orders.length > 0 &&
                    get().auditLogs.length > 0;
                if (shouldSkip) return;

                if (bootstrapPromise && !force) {
                    return bootstrapPromise;
                }

                set({isBootstrapping: true, bootstrapError: null});
                bootstrapPromise = Promise.all([listProducts(), listOrders(), listAuditLogs()])
                    .then(([products, orders, auditLogs]) => {
                        set({products, orders, auditLogs, bootstrapError: null});
                    })
                    .catch((error) => {
                        set({
                            bootstrapError: getApiErrorMessage(error, "Failed to load store data"),
                        });
                    })
                    .finally(() => {
                        set({isBootstrapping: false});
                        bootstrapPromise = null;
                    });

                return bootstrapPromise;
            },

            addToCart: (product, quantity = 1) => {
                set((state) => {
                    const existing = state.cart.find((i) => i.product.id === product.id);
                    if (existing) {
                        return {
                            cart: state.cart.map((i) =>
                                i.product.id === product.id
                                    ? {...i, quantity: i.quantity + quantity}
                                    : i
                            ),
                        };
                    }
                    return {cart: [...state.cart, {product, quantity}]};
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
                        i.product.id === productId ? {...i, quantity} : i
                    ),
                }));
            },

            clearCart: () => set({cart: []}),

            updateProduct: async (product, adminUser = "admin@maison.co") => {
                try {
                    const updated = await updateProductRequest(product.id, product);
                    const [products, auditLogs] = await Promise.all([listProducts(), listAuditLogs()]);
                    set({
                        products,
                        auditLogs,
                        bootstrapError: null,
                    });
                    return updated;
                } catch (error) {
                    set({
                        bootstrapError: getApiErrorMessage(
                            error,
                            `Failed to update product by ${adminUser}`
                        ),
                    });
                    return null;
                }
            },

            updateOrderStatus: async (orderId, status, adminUser = "admin@maison.co") => {
                try {
                    const updated = await updateOrderStatusRequest(orderId, status, adminUser);
                    const [orders, auditLogs] = await Promise.all([listOrders(), listAuditLogs()]);
                    set({
                        orders,
                        auditLogs,
                        bootstrapError: null,
                    });
                    return updated;
                } catch (error) {
                    set({
                        bootstrapError: getApiErrorMessage(error, "Failed to update order status"),
                    });
                    return null;
                }
            },

            addAuditLog: async (log) => {
                try {
                    const created = await createAuditLogRequest(log);
                    set((state) => ({
                        auditLogs: [created, ...state.auditLogs],
                        bootstrapError: null,
                    }));
                    return created;
                } catch (error) {
                    set({
                        bootstrapError: getApiErrorMessage(error, "Failed to create audit log"),
                    });
                    return null;
                }
            },

            placeOrder: async (customer, email, address) => {
                const cart = get().cart;
                if (cart.length === 0) return null;

                try {
                    const order = await createOrderRequest({
                        customer,
                        email,
                        address,
                        items: cart,
                    });
                    const [products, auditLogs] = await Promise.all([listProducts(), listAuditLogs()]);
                    set((state) => ({
                        orders: [order, ...state.orders.filter((existing) => existing.id !== order.id)],
                        products,
                        auditLogs,
                        cart: [],
                        bootstrapError: null,
                    }));
                    return order;
                } catch (error) {
                    set({
                        bootstrapError: getApiErrorMessage(error, "Failed to place order"),
                    });
                    return null;
                }
            },
        }),
        {
            name: "maison-store",
            partialize: (state) => ({cart: state.cart}),
        }
    )
);
