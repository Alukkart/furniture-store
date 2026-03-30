import type { CartItem, Order, OrderStatus } from "@/lib/types";
import { api } from "./http";

type CreateOrderPayload = {
  customer: string;
  email: string;
  address: string;
  items: CartItem[];
};

export async function listOrders() {
  const { data } = await api.get<Order[]>("/orders");
  return data;
}

export async function listMyOrders() {
  const { data } = await api.get<Order[]>("/orders/my");
  return data;
}

export async function createOrder(payload: CreateOrderPayload) {
  const { data } = await api.post<Order>("/orders", payload);
  return data;
}

export async function updateOrder(orderId: string, payload: Order, user?: string) {
  const { data } = await api.put<Order>(`/orders/${orderId}`, {
    customer: payload.customer,
    email: payload.email,
    address: payload.address,
    date: payload.date,
    status: payload.status,
    items: payload.items,
    user,
  });
  return data;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  user?: string
) {
  const { data } = await api.patch<Order>(`/orders/${orderId}/status`, { status, user });
  return data;
}
