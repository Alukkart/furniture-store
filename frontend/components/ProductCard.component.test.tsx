/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProductCard from "./ProductCard";
import { formatPrice } from "@/lib/currency";
import { usePreferences } from "@/lib/preferences";
import { useStore, type Product } from "@/lib/store";
import { click, render } from "@/test/render";

vi.mock("next/image", async () => {
  const React = await import("react");

  return {
    default: ({ src, alt, fill: _fill, priority: _priority, ...props }: { src: string; alt: string; fill?: boolean; priority?: boolean }) =>
      React.createElement("img", { src, alt, ...props }),
  };
});

vi.mock("next/link", async () => {
  const React = await import("react");

  return {
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) =>
      React.createElement("a", { href, ...props }, children),
  };
});

const product: Product = {
  id: "chair-1",
  name: "Oak Lounge Chair",
  category: "living",
  price: 42000,
  originalPrice: 51000,
  image: "/images/prod-chair-1.jpg",
  description: "Comfortable chair",
  dimensions: "80 x 70 x 75 cm",
  material: "Oak, textile",
  stock: 3,
  sku: "CHR-001",
  featured: true,
};

describe("ProductCard component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    usePreferences.setState({ locale: "en" });
    useStore.setState({ cart: [] });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders product title, sale badge, prices, and low-stock message", async () => {
    const view = await render(<ProductCard product={product} />);

    expect(view.container.textContent).toContain("Oak Lounge Chair");
    expect(view.container.textContent).toContain("SALE");
    expect(view.container.textContent).toContain(formatPrice(product.price));
    expect(view.container.textContent).toContain(formatPrice(product.originalPrice ?? 0));
    expect(view.container.textContent).toContain("Only 3 left in stock");
  });

  it("adds the product to cart when the add button is clicked", async () => {
    const view = await render(<ProductCard product={product} />);
    const button = view.container.querySelector("button[aria-label='Add Oak Lounge Chair to cart']");

    expect(button).not.toBeNull();
    await click(button as HTMLButtonElement);

    expect(useStore.getState().cart).toEqual([{ product, quantity: 1 }]);
  });

  it("renders quantity controls and updates quantity for cart items", async () => {
    useStore.setState({ cart: [{ product, quantity: 2 }] });
    const view = await render(<ProductCard product={product} />);
    const increase = view.container.querySelector("button[aria-label='Increase quantity']");
    const decrease = view.container.querySelector("button[aria-label='Decrease quantity']");

    expect(view.container.textContent).toContain("2");
    expect(increase).not.toBeNull();
    expect(decrease).not.toBeNull();

    await click(increase as HTMLButtonElement);
    expect(useStore.getState().cart[0].quantity).toBe(3);

    await click(decrease as HTMLButtonElement);
    expect(useStore.getState().cart[0].quantity).toBe(2);
  });

  it("disables add-to-cart for out-of-stock products", async () => {
    const view = await render(<ProductCard product={{ ...product, stock: 0, originalPrice: undefined }} />);
    const button = view.container.querySelector("button[aria-label='Add Oak Lounge Chair to cart']") as HTMLButtonElement;

    expect(view.container.textContent).toContain("Out of stock");
    expect(button.disabled).toBe(true);
  });
});
