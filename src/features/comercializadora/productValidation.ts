export type ProductIdentity = {
  id: string;
  barcode: string;
  name: string;
};

export type ProductValidationInput = ProductIdentity & {
  productLine?: string;
  presentation?: string;
  category: string;
  brand: string;
  manufacturer?: string;
  subcategory?: string;
};

export type ProductValidationErrors = Partial<Record<keyof ProductValidationInput, string>>;

export const normalizeBarcode = (value: string) => value.replace(/\D/g, "");

export const normalizeProductId = (value: string) => value.trim().toUpperCase();

export const isValidSimpleBarcode = (barcode: string) => /^\d{8,20}$/.test(barcode.trim());

export const findDuplicateProductId = <T extends ProductIdentity>(
  products: T[],
  productId: string,
  currentProductId?: string | null,
) => {
  const normalizedId = normalizeProductId(productId);

  return products.find(
    (product) =>
      normalizeProductId(product.id) === normalizedId &&
      normalizeProductId(product.id) !== normalizeProductId(currentProductId ?? ""),
  );
};

export const findDuplicateBarcode = <T extends ProductIdentity>(
  products: T[],
  barcode: string,
  currentProductId?: string | null,
) => {
  const normalized = normalizeBarcode(barcode);

  return products.find(
    (product) =>
      normalizeBarcode(product.barcode) === normalized &&
      normalizeProductId(product.id) !== normalizeProductId(currentProductId ?? ""),
  );
};

export const validateProductIdentity = <T extends ProductIdentity>(
  product: ProductValidationInput,
  products: T[],
  currentProductId?: string | null,
): ProductValidationErrors => {
  const errors: ProductValidationErrors = {};
  const duplicateId = product.id ? findDuplicateProductId(products, product.id, currentProductId) : undefined;
  const duplicateBarcode = product.barcode
    ? findDuplicateBarcode(products, product.barcode, currentProductId)
    : undefined;

  if (!product.id.trim()) {
    errors.id = "El ID del producto es obligatorio.";
  } else if (duplicateId) {
    errors.id = "El ID del producto ya existe.";
  }

  if (!product.barcode.trim()) {
    errors.barcode = "El código de barras es obligatorio.";
  } else if (!isValidSimpleBarcode(product.barcode)) {
    errors.barcode = "El código de barras debe contener solo números y tener entre 8 y 20 dígitos.";
  } else if (duplicateBarcode) {
    errors.barcode = `El código de barras ya existe. Producto asociado: ${duplicateBarcode.name}.`;
  }

  if (!product.name.trim()) {
    errors.name = "El nombre del producto es obligatorio.";
  }

  if (!product.productLine?.trim()) {
    errors.productLine = "Indica el producto base, por ejemplo Coca-Cola.";
  }

  if (!product.presentation?.trim()) {
    errors.presentation = "Indica la presentacion, por ejemplo 600 ml, 1.5 L o 3 L.";
  }

  if (!product.category.trim()) {
    errors.category = "Selecciona una categoría.";
  }

  if (!product.subcategory?.trim()) {
    errors.subcategory = "Selecciona una subcategoría.";
  }

  if (!product.brand.trim()) {
    errors.brand = "Selecciona una marca.";
  }

  return errors;
};
