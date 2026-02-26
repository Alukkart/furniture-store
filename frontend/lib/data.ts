// Static data — no "use client" so Server Components can import it directly

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

export type Order = {
  id: string;
  customer: string;
  email: string;
  items: CartItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
  address: string;
};

export type AuditLog = {
  id: string;
  action: string;
  category: "product" | "order" | "user" | "system";
  user: string;
  details: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
};

export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Haven Sectional Sofa",
    category: "Living Room",
    price: 2199,
    originalPrice: 2799,
    image: "/images/prod-sofa-1.jpg",
    description:
      "Sink into the ultimate comfort with our Haven Sectional Sofa. Crafted with a kiln-dried hardwood frame and wrapped in premium Belgian linen, this piece effortlessly blends form and function. The deep-set cushions provide hours of comfort, making it perfect for family gatherings or quiet evenings at home.",
    dimensions: "W 280cm × D 180cm × H 86cm",
    material: "Belgian Linen, Kiln-Dried Hardwood Frame",
    stock: 12,
    sku: "SOF-HVNS-BEI",
    featured: true,
    rating: 4.8,
    reviews: 124,
  },
  {
    id: "p2",
    name: "Aria Accent Chair",
    category: "Living Room",
    price: 649,
    image: "/images/prod-chair-1.jpg",
    description:
      "Make a statement with the Aria Accent Chair. Its sculptural silhouette and rich terracotta velvet upholstery add warmth and personality to any room. Solid oak legs provide a sturdy, grounded feel while keeping the look light and airy.",
    dimensions: "W 76cm × D 82cm × H 84cm",
    material: "Terracotta Velvet, Solid Oak",
    stock: 28,
    sku: "CHR-ARIA-TER",
    featured: true,
    rating: 4.7,
    reviews: 89,
  },
  {
    id: "p3",
    name: "Strata Walnut Dining Table",
    category: "Dining Room",
    price: 1899,
    originalPrice: 2299,
    image: "/images/prod-table-1.jpg",
    description:
      "The Strata Dining Table is a celebration of natural beauty. Each table is crafted from solid American walnut with a hand-rubbed oil finish that brings out the unique grain patterns. Seats six comfortably, with room for eight when entertaining.",
    dimensions: "W 200cm × D 95cm × H 76cm",
    material: "Solid American Walnut, Hand-Rubbed Oil Finish",
    stock: 8,
    sku: "TBL-STRW-WAL",
    featured: true,
    rating: 4.9,
    reviews: 56,
  },
  {
    id: "p4",
    name: "Cloud Platform Bed",
    category: "Bedroom",
    price: 1549,
    image: "/images/prod-bed-1.jpg",
    description:
      "Elevate your sleep experience with the Cloud Platform Bed. The low-profile silhouette and padded linen headboard create a serene retreat. Its solid base eliminates the need for a box spring, and the upholstered frame adds a luxurious hotel-like feel.",
    dimensions: "W 193cm × D 228cm × H 110cm (King)",
    material: "Cream Linen, Solid Pine Frame",
    stock: 15,
    sku: "BED-CLPL-CRM",
    featured: true,
    rating: 4.9,
    reviews: 201,
  },
  {
    id: "p5",
    name: "Lattice Oak Bookshelf",
    category: "Storage",
    price: 849,
    image: "/images/prod-shelf-1.jpg",
    description:
      "Organize your space in style with the Lattice Oak Bookshelf. Five open shelves give you plenty of room for books, plants, and decor, while the natural oak finish blends seamlessly with any interior palette.",
    dimensions: "W 90cm × D 35cm × H 200cm",
    material: "Natural Oak Veneer, Steel Frame",
    stock: 20,
    sku: "SHF-LTOK-NAT",
    featured: false,
    rating: 4.6,
    reviews: 43,
  },
  {
    id: "p6",
    name: "Studio Writing Desk",
    category: "Home Office",
    price: 599,
    image: "/images/prod-desk-1.jpg",
    description:
      "The Studio Writing Desk is designed for creative minds. Its clean lines, ample surface area, and smart cable management port make it the perfect workspace companion. Works equally well in a dedicated office or as a stylish entry console.",
    dimensions: "W 140cm × D 60cm × H 75cm",
    material: "Lacquered MDF, Powder-Coated Steel",
    stock: 35,
    sku: "DSK-STUD-WHT",
    featured: false,
    rating: 4.5,
    reviews: 67,
  },
  {
    id: "p7",
    name: "Soleil Brass Floor Lamp",
    category: "Lighting",
    price: 349,
    image: "/images/prod-lamp-1.jpg",
    description:
      "Cast a warm glow with the Soleil Floor Lamp. Its antique brass finish and pleated linen shade combine timeless elegance with modern proportions. An adjustable arm lets you direct light exactly where you need it.",
    dimensions: "H 165cm, Shade Diameter 42cm",
    material: "Antique Brass, Linen Shade",
    stock: 42,
    sku: "LMP-SOLB-BRS",
    featured: false,
    rating: 4.7,
    reviews: 98,
  },
  {
    id: "p8",
    name: "Marrakesh Wool Rug",
    category: "Rugs & Textiles",
    price: 479,
    originalPrice: 599,
    image: "/images/prod-rug-1.jpg",
    description:
      "Inspired by the intricate geometry of North African architecture, the Marrakesh Rug adds soul and warmth to any floor. Hand-tufted from 100% New Zealand wool, it features a subtle raised texture that rewards a closer look.",
    dimensions: "250cm × 350cm",
    material: "100% New Zealand Wool",
    stock: 18,
    sku: "RUG-MRKW-CRM",
    featured: false,
    rating: 4.8,
    reviews: 77,
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-2024-001",
    customer: "Sarah Mitchell",
    email: "s.mitchell@email.com",
    items: [{ product: PRODUCTS[0], quantity: 1 }, { product: PRODUCTS[1], quantity: 2 }],
    total: 3497,
    status: "delivered",
    date: "2025-02-15T10:30:00Z",
    address: "14 Oak Lane, San Francisco, CA 94102",
  },
  {
    id: "ORD-2024-002",
    customer: "James Thornton",
    email: "j.thornton@email.com",
    items: [{ product: PRODUCTS[2], quantity: 1 }],
    total: 1899,
    status: "shipped",
    date: "2025-02-18T14:15:00Z",
    address: "88 Maple Street, Brooklyn, NY 11201",
  },
  {
    id: "ORD-2024-003",
    customer: "Elena Rossi",
    email: "e.rossi@email.com",
    items: [{ product: PRODUCTS[3], quantity: 1 }, { product: PRODUCTS[6], quantity: 1 }],
    total: 1898,
    status: "processing",
    date: "2025-02-20T09:00:00Z",
    address: "201 Birch Ave, Austin, TX 78701",
  },
  {
    id: "ORD-2024-004",
    customer: "Marcus Webb",
    email: "m.webb@email.com",
    items: [{ product: PRODUCTS[4], quantity: 1 }, { product: PRODUCTS[7], quantity: 1 }],
    total: 1328,
    status: "pending",
    date: "2025-02-21T16:45:00Z",
    address: "55 Pine Road, Denver, CO 80203",
  },
  {
    id: "ORD-2024-005",
    customer: "Priya Sharma",
    email: "p.sharma@email.com",
    items: [{ product: PRODUCTS[5], quantity: 2 }],
    total: 1198,
    status: "cancelled",
    date: "2025-02-22T11:20:00Z",
    address: "99 Elm Street, Chicago, IL 60601",
  },
];

export const INITIAL_LOGS: AuditLog[] = [
  {
    id: "log-001",
    action: "Product Updated",
    category: "product",
    user: "admin@maison.co",
    details: "Updated price of Haven Sectional Sofa from $2,499 to $2,199",
    timestamp: "2025-02-26T09:15:00Z",
    severity: "info",
  },
  {
    id: "log-002",
    action: "Order Status Changed",
    category: "order",
    user: "admin@maison.co",
    details: "Order ORD-2024-002 status changed from 'processing' to 'shipped'",
    timestamp: "2025-02-26T10:30:00Z",
    severity: "info",
  },
  {
    id: "log-003",
    action: "Stock Alert",
    category: "product",
    user: "system",
    details: "Strata Walnut Dining Table stock dropped below threshold (8 units remaining)",
    timestamp: "2025-02-26T11:00:00Z",
    severity: "warning",
  },
  {
    id: "log-004",
    action: "Order Cancelled",
    category: "order",
    user: "admin@maison.co",
    details: "Order ORD-2024-005 cancelled per customer request — refund initiated",
    timestamp: "2025-02-25T14:20:00Z",
    severity: "warning",
  },
  {
    id: "log-005",
    action: "Product Added",
    category: "product",
    user: "manager@maison.co",
    details: "New product 'Soleil Brass Floor Lamp' added to Lighting category (SKU: LMP-SOLB-BRS)",
    timestamp: "2025-02-24T16:00:00Z",
    severity: "info",
  },
  {
    id: "log-006",
    action: "User Login",
    category: "user",
    user: "manager@maison.co",
    details: "Successful admin login from IP 192.168.1.45",
    timestamp: "2025-02-24T15:58:00Z",
    severity: "info",
  },
  {
    id: "log-007",
    action: "Bulk Stock Update",
    category: "product",
    user: "admin@maison.co",
    details: "Stock levels updated for 5 products after warehouse inventory count",
    timestamp: "2025-02-23T10:00:00Z",
    severity: "info",
  },
  {
    id: "log-008",
    action: "Failed Login Attempt",
    category: "user",
    user: "unknown",
    details: "3 consecutive failed login attempts from IP 203.0.113.42",
    timestamp: "2025-02-23T03:15:00Z",
    severity: "critical",
  },
];
