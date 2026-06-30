export type ProductVariantLike = {
  id?: string;
  barcode?: string;
  name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  productLine?: string;
  presentation?: string;
};

const presentationPattern =
  /\b\d+(?:[.,]\d+)?\s?(?:ml|l|lt|lts|litro|litros|kg|g|gr|pz|pza|pzas|piezas|pack|paq|sobres?|rollos?)\b/i;

const normalizeText = (value?: string) => value?.trim().replace(/\s+/g, " ") ?? "";

const normalizeKey = (value: string) =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const inferPresentationFromName = (name: string) => normalizeText(name.match(presentationPattern)?.[0]);

export const getProductPresentation = (product: Pick<ProductVariantLike, "name" | "presentation">) =>
  normalizeText(product.presentation) || inferPresentationFromName(product.name) || "Presentacion comercial";

export const getProductLine = (product: Pick<ProductVariantLike, "name" | "productLine" | "presentation">) => {
  const explicitProductLine = normalizeText(product.productLine);

  if (explicitProductLine) {
    return explicitProductLine;
  }

  const inferredPresentation = normalizeText(product.presentation) || inferPresentationFromName(product.name);

  if (!inferredPresentation) {
    return normalizeText(product.name);
  }

  const productLine = product.name.replace(new RegExp(escapeRegExp(inferredPresentation), "i"), "");

  return normalizeText(productLine.replace(/\s+[-|]\s*$/, "")) || normalizeText(product.name);
};

export const buildVariantName = (productLine: string, presentation: string) =>
  [normalizeText(productLine), normalizeText(presentation)].filter(Boolean).join(" ");

export const getVariantSearchText = (product: ProductVariantLike) =>
  [
    product.id,
    product.barcode,
    product.name,
    getProductLine(product),
    getProductPresentation(product),
    product.brand,
    product.category,
    product.subcategory,
  ]
    .filter(Boolean)
    .join(" ");

export const getVariantGroupKey = (product: ProductVariantLike) =>
  normalizeKey([product.brand, getProductLine(product)].filter(Boolean).join("|"));

export const getVariantCount = <T extends ProductVariantLike>(product: T, products: T[]) => {
  const groupKey = getVariantGroupKey(product);

  return products.filter((item) => getVariantGroupKey(item) === groupKey).length;
};

export const formatVariantCount = (count: number) =>
  count === 1 ? "1 presentacion" : `${count} presentaciones`;
