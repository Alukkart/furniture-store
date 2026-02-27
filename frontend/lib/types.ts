export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  dimensions: string;
  material: string;
  stock: number;
  sku: string;
  featured: boolean;
  rating: number;
  reviews: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  customer: string;
  email: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  date: string;
  address: string;
};

export type AuditCategory = "product" | "order" | "user" | "system";
export type AuditSeverity = "info" | "warning" | "critical";

export type AuditLog = {
  id: string;
  action: string;
  category: AuditCategory;
  user: string;
  details: string;
  timestamp: string;
  severity: AuditSeverity;
};

export type AdminUser = {
  email: string;
  name: string;
  role: "Administrator" | "Manager";
};
