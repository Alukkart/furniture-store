/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OrderForm from "./OrderForm";
import { formatPrice } from "@/lib/currency";
import { usePreferences } from "@/lib/preferences";
import type { Order, Product } from "@/lib/types";
import { click, fieldByLabel, inputValue, render, selectValue, submit } from "@/test/render";

const products: Product[] = [
  {
    id: "chair-1",
    name: "Oak Lounge Chair",
    category: "living",
    price: 42000,
    image: "/images/prod-chair-1.jpg",
    description: "Comfortable chair",
    dimensions: "80 x 70 x 75 cm",
    material: "Oak, textile",
    stock: 5,
    sku: "CHR-001",
    featured: true,
  },
  {
    id: "lamp-1",
    name: "Floor Lamp",
    category: "living",
    price: 18000,
    image: "/images/prod-lamp-1.jpg",
    description: "Warm light",
    dimensions: "35 x 35 x 165 cm",
    material: "Metal",
    stock: 12,
    sku: "LMP-001",
    featured: false,
  },
];

const order: Order = {
  id: "ord-1",
  customer: "Иванов Иван",
  email: "ivan@example.com",
  address: "ул. Ленина, д. 10",
  date: "2026-06-01T10:00:00.000Z",
  status: "pending",
  total: 84000,
  items: [{ product: products[0], quantity: 2 }],
};

describe("OrderForm component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    usePreferences.setState({ locale: "en" });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders order fields, line total, and order total", async () => {
    const view = await render(<OrderForm initialOrder={order} products={products} submitLabel="Save order" onSubmit={vi.fn()} />);

    expect(fieldByLabel<HTMLInputElement>(view.container, "Order ID").value).toBe("ord-1");
    expect(fieldByLabel<HTMLInputElement>(view.container, "Customer").value).toBe("Иванов Иван");
    expect(view.container.textContent).toContain(`Line total: ${formatPrice(84000)}`);
    expect(view.container.textContent).toContain(formatPrice(84000));
  });

  it("adds and removes order items", async () => {
    const view = await render(<OrderForm initialOrder={order} products={products} submitLabel="Save order" onSubmit={vi.fn()} />);
    const addButton = Array.from(view.container.querySelectorAll("button")).find((button) => button.textContent === "Add item");

    await click(addButton as HTMLButtonElement);
    expect(view.container.querySelectorAll("select").length).toBeGreaterThanOrEqual(2);

    const removeButtons = Array.from(view.container.querySelectorAll("button")).filter((button) => button.textContent === "Remove");
    await click(removeButtons[1]);

    expect(Array.from(view.container.querySelectorAll("button")).filter((button) => button.textContent === "Remove")).toHaveLength(1);
  });

  it("blocks submit when customer, email, or address is invalid", async () => {
    const onSubmit = vi.fn();
    const invalidOrder: Order = {
      ...order,
      customer: "Ivan",
      email: "bad-email",
      address: "без номера",
    };
    const view = await render(<OrderForm initialOrder={invalidOrder} products={products} submitLabel="Save order" onSubmit={onSubmit} />);

    await submit(view.container.querySelector("form") as HTMLFormElement);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(view.container.textContent).toContain("Customer, email, and address are required.");
  });

  it("blocks submit when an item quantity is zero", async () => {
    const onSubmit = vi.fn();
    const invalidOrder: Order = {
      ...order,
      items: [{ product: products[0], quantity: 0 }],
    };
    const view = await render(<OrderForm initialOrder={invalidOrder} products={products} submitLabel="Save order" onSubmit={onSubmit} />);

    await submit(view.container.querySelector("form") as HTMLFormElement);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(view.container.textContent).toContain("Each item quantity must be greater than zero.");
  });

  it("submits normalized customer, email, address, status, and changed product", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const messyOrder: Order = {
      ...order,
      customer: "  Иванов   Иван  ",
      email: "  IVAN@EXAMPLE.COM  ",
      address: "  ул. Ленина,   д. 10  ",
    };
    const view = await render(<OrderForm initialOrder={messyOrder} products={products} submitLabel="Save order" onSubmit={onSubmit} />);

    await selectValue(fieldByLabel<HTMLSelectElement>(view.container, "Status"), "processing");
    await selectValue(fieldByLabel<HTMLSelectElement>(view.container, "Product"), "lamp-1");
    await inputValue(fieldByLabel<HTMLInputElement>(view.container, "Qty"), "3");
    await submit(view.container.querySelector("form") as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "Иванов Иван",
        email: "ivan@example.com",
        address: "ул. Ленина, д. 10",
        status: "processing",
        items: [{ product: products[1], quantity: 3 }],
      })
    );
  });
});
