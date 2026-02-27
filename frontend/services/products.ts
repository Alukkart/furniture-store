import type { Product } from "@/lib/types";
import { api } from "./http";

export async function listProducts() {
  const { data } = await api.get<Product[]>("/products");
  return data;
}

export async function getProduct(id: string) {
  const { data } = await api.get<Product>(`/products/${id}`);
  return data;
}

export async function updateProduct(id: string, payload: Product) {
  const { data } = await api.put<Product>(`/products/${id}`, payload);
  return data;
}
