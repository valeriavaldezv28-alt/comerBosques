import { describe, expect, it } from "vitest";
import {
  buildVariantName,
  formatVariantCount,
  getProductLine,
  getProductPresentation,
  getVariantCount,
} from "./productVariants";

const products = [
  { id: "PROD-1", name: "Coca-Cola 600 ml", brand: "Coca-Cola" },
  { id: "PROD-2", name: "Coca-Cola 1.5 L", brand: "Coca-Cola" },
  { id: "PROD-3", name: "Fanta 600 ml", brand: "Fanta" },
];

describe("productVariants", () => {
  it("infers product line and presentation from legacy names", () => {
    expect(getProductLine(products[0])).toBe("Coca-Cola");
    expect(getProductPresentation(products[0])).toBe("600 ml");
  });

  it("groups variants by brand and product line", () => {
    expect(getVariantCount(products[0], products)).toBe(2);
    expect(formatVariantCount(2)).toBe("2 presentaciones");
  });

  it("builds a commercial name from product line and presentation", () => {
    expect(buildVariantName("Coca-Cola", "3 L")).toBe("Coca-Cola 3 L");
  });
});
