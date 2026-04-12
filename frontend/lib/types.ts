export type Product = {
  id: string;
  name: string;
  category: string;
  category_id?: number;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  dimensions: string;
  material: string;
  stock: number;
  sku: string;
  is_active?: boolean;
  featured: boolean;
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
  entity?: string;
  entity_id?: string;
  result?: string;
};

export type RoleName = "Administrator" | "Manager" | "Warehouse" | "Executive" | "Client";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: RoleName;
};

export type ForecastRow = {
  category_id: number;
  category: string;
  forecast_qty: number;
  recommended_buy: number;
  factors: string;
  confidence: number;
};

export type ForecastResponse = {
  trained_at: string;
  mae: number;
  rmse: number;
  period_months: number;
  rows: ForecastRow[];
};
