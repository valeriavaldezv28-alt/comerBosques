import { describe, expect, it } from "vitest";
import {
  defaultInventoryCatalogs,
  getSubcategoriesByCategoryName,
  inventoryBrands,
  normalizeInventoryCatalogs,
} from "./catalogs";

describe("inventory catalogs", () => {
  it("keeps brands unique and alphabetically sorted", () => {
    const brandNames = inventoryBrands.map((brand) => brand.name);
    const sortedBrandNames = [...brandNames].sort((left, right) =>
      left.localeCompare(right, "es-MX", { sensitivity: "base" }),
    );

    expect(brandNames).toEqual(sortedBrandNames);
    expect(new Set(brandNames.map((name) => name.toLocaleLowerCase("es-MX"))).size).toBe(brandNames.length);
  });

  it("returns only the subcategories for the selected category", () => {
    const beverageSubcategories = getSubcategoriesByCategoryName("Bebidas").map((subcategory) => subcategory.name);

    expect(beverageSubcategories).toEqual([
      "Refrescos",
      "Agua",
      "Jugos",
      "Bebidas isotónicas",
      "Energéticas",
      "Té",
      "Café",
    ]);
  });

  it("normalizes remote catalogs and removes duplicate brands", () => {
    const catalogs = normalizeInventoryCatalogs({
      ...defaultInventoryCatalogs,
      brands: [
        { id: "sprite", name: "Sprite" },
        { id: "sprite-duplicate", name: "sprite" },
        { id: "coca-cola", name: "Coca-Cola" },
      ],
    });

    expect(catalogs.brands.map((brand) => brand.name)).toEqual(["Coca-Cola", "Sprite"]);
  });
});
