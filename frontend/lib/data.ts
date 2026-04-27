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
    id: "p-1738396800000000000",
    name: "Модульный диван «Гавань»",
    category: "Гостиная",
    price: 2199,
    originalPrice: 2799,
    image: "/images/prod-sofa-1.jpg",
    description:
      "Просторный модульный диван для гостиной с глубокой посадкой, мягкими подушками и выразительной фактурой ткани. Отлично подходит для семейной зоны отдыха и больших гостиных.",
    dimensions: "Ш 280 см × Г 180 см × В 86 см",
    material: "Бельгийский лён, каркас из массива дерева",
    stock: 12,
    sku: "SOF-HVNS-BEI",
    featured: true,
  },
  {
    id: "p-1738397400000000000",
    name: "Акцентное кресло «Ария»",
    category: "Гостиная",
    price: 649,
    image: "/images/prod-chair-1.jpg",
    description:
      "Мягкое кресло с выразительным силуэтом и тёплой велюровой обивкой. Подойдёт для уголка чтения, спальни или уютной зоны у окна.",
    dimensions: "Ш 76 см × Г 82 см × В 84 см",
    material: "Велюр, массив дуба",
    stock: 28,
    sku: "CHR-ARIA-TER",
    featured: true,
  },
  {
    id: "p-1738398000000000000",
    name: "Обеденный стол «Страта» из ореха",
    category: "Столовая",
    price: 1899,
    originalPrice: 2299,
    image: "/images/prod-table-1.jpg",
    description:
      "Обеденный стол из натурального ореха с акцентом на текстуру древесины. За ним комфортно разместятся 6–8 человек.",
    dimensions: "Ш 200 см × Г 95 см × В 76 см",
    material: "Массив ореха, масляное покрытие",
    stock: 8,
    sku: "TBL-STRW-WAL",
    featured: true,
  },
  {
    id: "p-1738398600000000000",
    name: "Кровать-платформа «Облако»",
    category: "Спальня",
    price: 1549,
    image: "/images/prod-bed-1.jpg",
    description:
      "Кровать с мягким изголовьем и устойчивым основанием создаёт ощущение спокойного отельного интерьера и подходит для просторной спальни.",
    dimensions: "193 см × 228 см × 110 см (King Size)",
    material: "Лён, массив сосны",
    stock: 15,
    sku: "BED-CLPL-CRM",
    featured: true,
  },
  {
    id: "p-1738399200000000000",
    name: "Стеллаж «Латтис» из дуба",
    category: "Хранение",
    price: 849,
    image: "/images/prod-shelf-1.jpg",
    description:
      "Открытый стеллаж для книг и декора с лаконичным дубовым фасадом. Хорошо смотрится в гостиной, кабинете и спальне.",
    dimensions: "Ш 90 см × Г 35 см × В 200 см",
    material: "Шпон дуба, стальной каркас",
    stock: 20,
    sku: "SHF-LTOK-NAT",
    featured: false,
  },
  {
    id: "p-1738399800000000000",
    name: "Письменный стол «Студио»",
    category: "Домашний офис",
    price: 599,
    image: "/images/prod-desk-1.jpg",
    description:
      "Компактный письменный стол для домашнего кабинета с удобной рабочей поверхностью и лаконичным дизайном.",
    dimensions: "Ш 140 см × Г 60 см × В 75 см",
    material: "МДФ, порошковая окраска стали",
    stock: 35,
    sku: "DSK-STUD-WHT",
    featured: false,
  },
  {
    id: "p-1738400400000000000",
    name: "Торшер «Солей»",
    category: "Освещение",
    price: 349,
    image: "/images/prod-lamp-1.jpg",
    description:
      "Напольный светильник с тёплым рассеянным светом и регулируемой стойкой. Хорошо работает как вечерний свет в зоне отдыха.",
    dimensions: "В 165 см, диаметр абажура 42 см",
    material: "Латунь, льняной абажур",
    stock: 42,
    sku: "LMP-SOLB-BRS",
    featured: false,
  },
  {
    id: "p-1738401000000000000",
    name: "Шерстяной ковёр «Марракеш»",
    category: "Ковры и текстиль",
    price: 479,
    originalPrice: 599,
    image: "/images/prod-rug-1.jpg",
    description:
      "Плотный шерстяной ковёр с геометрическим орнаментом и мягкой фактурой. Добавляет тепла и уюта в интерьер.",
    dimensions: "250 см × 350 см",
    material: "100% шерсть",
    stock: 18,
    sku: "RUG-MRKW-CRM",
    featured: false,
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-1739615400000000000",
    customer: "Илья Соколов",
    email: "i.sokolov@yandex.ru",
    items: [{ product: PRODUCTS[0], quantity: 1 }, { product: PRODUCTS[1], quantity: 2 }],
    total: 3497,
    status: "delivered",
    date: "2025-02-15T10:30:00Z",
    address: "г. Москва, Ленинский проспект, д. 62, кв. 41",
  },
  {
    id: "ORD-1739888100000000000",
    customer: "Мария Романова",
    email: "m.romanova@mail.ru",
    items: [{ product: PRODUCTS[2], quantity: 1 }],
    total: 1899,
    status: "shipped",
    date: "2025-02-18T14:15:00Z",
    address: "г. Санкт-Петербург, ул. Типанова, д. 14, кв. 87",
  },
  {
    id: "ORD-1740042000000000000",
    customer: "Артём Ковалёв",
    email: "art.kovalev@yandex.ru",
    items: [{ product: PRODUCTS[3], quantity: 1 }, { product: PRODUCTS[6], quantity: 1 }],
    total: 1898,
    status: "processing",
    date: "2025-02-20T09:00:00Z",
    address: "г. Казань, ул. Чистопольская, д. 33, кв. 12",
  },
  {
    id: "ORD-1740156300000000000",
    customer: "Екатерина Смирнова",
    email: "ek.smirnova@mail.ru",
    items: [{ product: PRODUCTS[4], quantity: 1 }, { product: PRODUCTS[7], quantity: 1 }],
    total: 1328,
    status: "pending",
    date: "2025-02-21T16:45:00Z",
    address: "г. Екатеринбург, ул. Малышева, д. 18, кв. 24",
  },
  {
    id: "ORD-1740223200000000000",
    customer: "Дмитрий Воробьёв",
    email: "d.vorobev@yandex.ru",
    items: [{ product: PRODUCTS[5], quantity: 2 }],
    total: 1198,
    status: "cancelled",
    date: "2025-02-22T11:20:00Z",
    address: "г. Новосибирск, Красный проспект, д. 101, кв. 9",
  },
];

export const INITIAL_LOGS: AuditLog[] = [
  {
    id: "log-1740561300000000000",
    action: "Обновление товара",
    category: "product",
    user: "admin@maison.co",
    details: "Цена товара «Модульный диван «Гавань»» изменена с 2 499 ₽ до 2 199 ₽",
    timestamp: "2025-02-26T09:15:00Z",
    severity: "info",
  },
  {
    id: "log-1740565800000000000",
    action: "Смена статуса заказа",
    category: "order",
    user: "manager@maison.co",
    details: "Статус заказа ORD-1739888100000000000 изменён на «Передан в доставку»",
    timestamp: "2025-02-26T10:30:00Z",
    severity: "info",
  },
  {
    id: "log-1740567600000000000",
    action: "Оповещение об остатках",
    category: "product",
    user: "система",
    details: "Остаток товара «Обеденный стол «Страта» из ореха» опустился до порогового значения (8 шт.)",
    timestamp: "2025-02-26T11:00:00Z",
    severity: "warning",
  },
  {
    id: "log-1740493200000000000",
    action: "Заказ отменён",
    category: "order",
    user: "admin@maison.co",
    details: "Заказ ORD-1740223200000000000 отменён по запросу клиента — инициирован возврат средств",
    timestamp: "2025-02-25T14:20:00Z",
    severity: "warning",
  },
  {
    id: "log-1740412800000000000",
    action: "Добавлен товар",
    category: "product",
    user: "manager@maison.co",
    details: "Новый товар «Торшер «Солей»» добавлен в категорию «Освещение» (SKU: LMP-SOLB-BRS)",
    timestamp: "2025-02-24T16:00:00Z",
    severity: "info",
  },
  {
    id: "log-1740412680000000000",
    action: "Вход пользователя",
    category: "user",
    user: "manager@maison.co",
    details: "Успешный вход администратора с IP 192.168.1.45",
    timestamp: "2025-02-24T15:58:00Z",
    severity: "info",
  },
  {
    id: "log-1740304800000000000",
    action: "Массовое обновление остатков",
    category: "product",
    user: "admin@maison.co",
    details: "Остатки обновлены для 5 товаров после инвентаризации склада",
    timestamp: "2025-02-23T10:00:00Z",
    severity: "info",
  },
  {
    id: "log-1740280500000000000",
    action: "Неудачная попытка входа",
    category: "user",
    user: "неизвестный пользователь",
    details: "Зафиксировано 3 неудачных попытки входа с IP 203.0.113.42",
    timestamp: "2025-02-23T03:15:00Z",
    severity: "critical",
  },
];
