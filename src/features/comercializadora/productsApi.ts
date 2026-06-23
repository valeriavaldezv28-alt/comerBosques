const BASE = "/api/products";

export type ApiProduct = Record<string, unknown>;

export const fetchProducts = (): Promise<ApiProduct[]> =>
  fetch(BASE).then((res) => res.json());

export const createProduct = (product: ApiProduct): Promise<void> =>
  fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  }).then(() => undefined);

export const updateProduct = (id: string, product: ApiProduct): Promise<void> =>
  fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  }).then(() => undefined);

export const deleteProduct = (id: string): Promise<void> =>
  fetch(`${BASE}/${id}`, { method: "DELETE" }).then(() => undefined);
