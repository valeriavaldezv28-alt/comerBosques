const BASE = "/api/products";

export type ApiProduct = Record<string, unknown>;

const parseErrorMessage = async (res: Response) => {
  try {
    const body = (await res.json()) as { message?: string; error?: string; detail?: string };
    return body.message ?? body.error ?? body.detail ?? `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
};

const assertOk = async (res: Response) => {
  if (!res.ok) {
    throw new Error(await parseErrorMessage(res));
  }
};

export const fetchProducts = (): Promise<ApiProduct[]> =>
  fetch(BASE).then(async (res) => {
    await assertOk(res);
    return res.json() as Promise<ApiProduct[]>;
  });

export const createProduct = (product: ApiProduct): Promise<void> =>
  fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  }).then(assertOk);

export const updateProduct = (id: string, product: ApiProduct): Promise<void> =>
  fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  }).then(assertOk);

export const deleteProduct = (id: string): Promise<void> =>
  fetch(`${BASE}/${id}`, { method: "DELETE" }).then(assertOk);
