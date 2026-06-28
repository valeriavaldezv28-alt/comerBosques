import { describe, expect, it } from "vitest";
import {
  findDuplicateBarcode,
  findDuplicateProductId,
  isValidSimpleBarcode,
  validateProductIdentity,
} from "./productValidation";

const products = [
  { id: "PROD-000001", barcode: "7501055300072", name: "Coca-Cola 600ml" },
  { id: "PROD-000002", barcode: "12345678", name: "Galletas" },
];

describe("productValidation", () => {
  it("accepts numeric barcodes from 8 to 20 digits", () => {
    expect(isValidSimpleBarcode("12345678")).toBe(true);
    expect(isValidSimpleBarcode("7501055300072")).toBe(true);
    expect(isValidSimpleBarcode("12345678901234567890")).toBe(true);
  });

  it("rejects non-numeric, short, and long barcodes", () => {
    expect(isValidSimpleBarcode("ABC-12345678")).toBe(false);
    expect(isValidSimpleBarcode("1234567")).toBe(false);
    expect(isValidSimpleBarcode("123456789012345678901")).toBe(false);
  });

  it("detects duplicate barcode and product id", () => {
    expect(findDuplicateBarcode(products, "7501055300072")?.name).toBe("Coca-Cola 600ml");
    expect(findDuplicateProductId(products, "prod-000002")?.name).toBe("Galletas");
  });

  it("allows editing the same product identity", () => {
    const errors = validateProductIdentity(
      {
        id: "PROD-000001",
        barcode: "7501055300072",
        name: "Coca-Cola 600ml",
        category: "Bebidas",
        subcategory: "Refrescos",
        brand: "Coca-Cola",
      },
      products,
      "PROD-000001",
    );

    expect(errors).toEqual({});
  });

  it("requires category, subcategory, and brand", () => {
    const errors = validateProductIdentity(
      {
        id: "PROD-000003",
        barcode: "1234567890",
        name: "Producto nuevo",
        category: "",
        subcategory: "",
        brand: "",
      },
      products,
    );

    expect(errors.category).toBe("Selecciona una categoría.");
    expect(errors.subcategory).toBe("Selecciona una subcategoría.");
    expect(errors.brand).toBe("Selecciona una marca.");
  });
});
