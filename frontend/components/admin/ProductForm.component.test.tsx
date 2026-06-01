/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProductForm, { createEmptyProduct } from "./ProductForm";
import { formatPrice } from "@/lib/currency";
import { usePreferences } from "@/lib/preferences";
import type { Product } from "@/lib/types";
import { click, fieldByLabel, inputValue, render, submit } from "@/test/render";

const product: Product = {
  id: "desk-1",
  name: "Writing Desk",
  category: "office",
  price: 76000,
  originalPrice: 92000,
  image: "/images/prod-desk-1.jpg",
  description: "Compact desk for home office",
  dimensions: "120 x 60 x 75 cm",
  material: "Walnut veneer",
  stock: 8,
  sku: "DSK-001",
  featured: false,
};

describe("ProductForm component", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    usePreferences.setState({ locale: "en" });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates an empty product draft with catalog defaults", () => {
    expect(createEmptyProduct()).toMatchObject({
      id: "",
      name: "",
      price: 0,
      stock: 0,
      sku: "",
      featured: false,
    });
  });

  it("renders initial product values and preview", async () => {
    const view = await render(<ProductForm initialProduct={product} submitLabel="Save product" onSubmit={vi.fn()} />);

    expect(fieldByLabel<HTMLInputElement>(view.container, "Name").value).toBe("Writing Desk");
    expect(fieldByLabel<HTMLInputElement>(view.container, "SKU").value).toBe("DSK-001");
    expect(view.container.textContent).toContain(formatPrice(product.price));
    expect(view.container.textContent).toContain("/images/prod-desk-1.jpg");
  });

  it("blocks submit and shows an error when required fields are empty", async () => {
    const onSubmit = vi.fn();
    const view = await render(<ProductForm initialProduct={createEmptyProduct()} submitLabel="Create product" onSubmit={onSubmit} />);

    await submit(view.container.querySelector("form") as HTMLFormElement);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(view.container.textContent).toContain("Fill in all required fields before saving.");
  });

  it("submits trimmed text, numeric values, and featured flag", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const view = await render(<ProductForm initialProduct={createEmptyProduct()} submitLabel="Create product" onSubmit={onSubmit} />);

    await inputValue(fieldByLabel<HTMLInputElement>(view.container, "Product ID"), "  table-1  ");
    await inputValue(fieldByLabel<HTMLInputElement>(view.container, "SKU"), "  TBL-001  ");
    await inputValue(fieldByLabel<HTMLInputElement>(view.container, "Name"), "  Dining Table  ");
    await inputValue(fieldByLabel<HTMLInputElement>(view.container, "Image Path"), "  /images/prod-table-1.jpg  ");
    await inputValue(fieldByLabel<HTMLTextAreaElement>(view.container, "Description"), "  Solid dining table  ");
    await inputValue(fieldByLabel<HTMLInputElement>(view.container, "Dimensions"), "  180 x 90 x 76 cm  ");
    await inputValue(fieldByLabel<HTMLInputElement>(view.container, "Material"), "  Oak  ");
    await inputValue(fieldByLabel<HTMLInputElement>(view.container, "Price"), "125000");
    await inputValue(fieldByLabel<HTMLInputElement>(view.container, "Original Price"), "140000");
    await inputValue(fieldByLabel<HTMLInputElement>(view.container, "Stock"), "6");
    await click(fieldByLabel<HTMLInputElement>(view.container, "Featured product"));
    await submit(view.container.querySelector("form") as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "table-1",
        sku: "TBL-001",
        name: "Dining Table",
        image: "/images/prod-table-1.jpg",
        description: "Solid dining table",
        dimensions: "180 x 90 x 76 cm",
        material: "Oak",
        price: 125000,
        originalPrice: 140000,
        stock: 6,
        featured: true,
      })
    );
  });
});
