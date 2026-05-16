export interface EnvConfig {
  API_URL: string | null;
  IS_DEV: boolean;
  SUPPORT_EMAIL: string;
  DOCS_URL: string;
}

const obtenerApiUrl = (): string | null => {
  const apiUrl = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL;

  return apiUrl ? apiUrl.replace(/\/$/, "") : null;
};

export const ENV: EnvConfig = {
  API_URL: obtenerApiUrl(),
  IS_DEV: import.meta.env.DEV,
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL ?? "soporte@comercializadorabosques.com",
  DOCS_URL: import.meta.env.VITE_DOCS_URL ?? "/",
} as const;

export const validarEnv = (): void => {
  return;
};
