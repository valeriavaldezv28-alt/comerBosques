import type { InventoryCatalogs } from "./catalogs";

const BASE = "/api/catalogs";

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

export const fetchCatalogs = (): Promise<InventoryCatalogs> =>
  fetch(BASE).then(async (res) => {
    await assertOk(res);
    return res.json() as Promise<InventoryCatalogs>;
  });

export const saveCatalogs = (catalogs: InventoryCatalogs): Promise<void> =>
  fetch(BASE, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(catalogs),
  }).then(assertOk);
