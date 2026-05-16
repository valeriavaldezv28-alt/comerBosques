export interface EnvConfig {
  /**
   * URL base de la API
   * En desarrollo: /api/v1 (proxy de Vite)
   * En producción: URL del servidor de backend
   */
  API_URL: string;

  /**
   * Tiempo maximo de espera para requests HTTP.
   */
  API_REQUEST_TIMEOUT_MS: number;

  /**
   * Reintentos por defecto para queries contra API.
   */
  API_RETRY_LIMIT: number;

  /**
   * Endpoint opcional dedicado para intents del dashboard.
   */
  DASHBOARD_INTENTS_API_URL: string | null;

  /**
   * Intervalo de refresco de datos del dashboard en milisegundos
   * Default: 300000 (5 minutos)
   */
  DASHBOARD_REFRESH_INTERVAL: number;

  /**
   * Margen de tiempo antes de expiración para refrescar token (ms)
   * Default: 30000 (30 segundos)
   */
  TOKEN_REFRESH_SKEW_MS: number;

  /**
   * Tiempo de inactividad antes de cerrar sesion (ms)
   * Default: 60000 (1 minuto)
   */
  SESSION_INACTIVITY_TIMEOUT_MS: number;

  /**
   * Token de desarrollo para facilitar pruebas sin UI
   * Solo disponible en modo desarrollo
   */
  DEV_TOKEN: string | null;

  /**
   * Modo de desarrollo
   */
  IS_DEV: boolean;

  /**
   * URLs y contactos globales de soporte.
   */
  SUPPORT_EMAIL: string;
  DOCS_URL: string;
}

const MIN_TIMEOUT_MS = 1_000;
const DEFAULT_API_REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_API_RETRY_LIMIT = 1;
const DEFAULT_DASHBOARD_REFRESH_INTERVAL_MS = 300_000;
const DEFAULT_TOKEN_REFRESH_SKEW_MS = 30_000;
const DEFAULT_SESSION_INACTIVITY_TIMEOUT_MS = 60_000;
const DEFAULT_SUPPORT_EMAIL = "support@magictronic.com";
const DEFAULT_DOCS_URL = "https://magictronic.com/docs";

const obtenerApiUrl = (): string => {
  if (import.meta.env.DEV) {
    return "/api/v1";
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL;

  if (!apiUrl) {
    console.warn("VITE_API_URL no configurada, usando fallback /api/v1");
    return "/api/v1";
  }

  // Remover slash final si existe
  return apiUrl.replace(/\/$/, "");
};

const obtenerNumeroEntero = (
  value: string | undefined,
  fallback: number,
  envKey: string,
  minimo = MIN_TIMEOUT_MS,
): number => {
  if (!value) {
    return fallback;
  }

  const numero = Number(value);

  if (!Number.isInteger(numero) || numero < minimo) {
    console.warn(`${envKey} invalido, usando ${fallback}`);
    return fallback;
  }

  return numero;
};

const obtenerApiRequestTimeout = (): number =>
  obtenerNumeroEntero(
    import.meta.env.VITE_API_REQUEST_TIMEOUT_MS,
    DEFAULT_API_REQUEST_TIMEOUT_MS,
    "VITE_API_REQUEST_TIMEOUT_MS",
  );

const obtenerApiRetryLimit = (): number =>
  obtenerNumeroEntero(
    import.meta.env.VITE_API_RETRY_LIMIT,
    DEFAULT_API_RETRY_LIMIT,
    "VITE_API_RETRY_LIMIT",
    0,
  );

const obtenerDashboardIntentsApiUrl = (): string | null => {
  const apiUrl = import.meta.env.VITE_DASHBOARD_INTENTS_API_URL;
  return apiUrl ? apiUrl.replace(/\/$/, "") : null;
};

const obtenerTokenRefreshSkew = (): number =>
  obtenerNumeroEntero(
    import.meta.env.VITE_TOKEN_REFRESH_SKEW_MS,
    DEFAULT_TOKEN_REFRESH_SKEW_MS,
    "VITE_TOKEN_REFRESH_SKEW_MS",
  );

const obtenerSessionInactivityTimeout = (): number =>
  obtenerNumeroEntero(
    import.meta.env.VITE_SESSION_INACTIVITY_TIMEOUT_MS,
    DEFAULT_SESSION_INACTIVITY_TIMEOUT_MS,
    "VITE_SESSION_INACTIVITY_TIMEOUT_MS",
  );

const obtenerRefreshInterval = (): number =>
  obtenerNumeroEntero(
    import.meta.env.VITE_DASHBOARD_REFRESH_INTERVAL,
    DEFAULT_DASHBOARD_REFRESH_INTERVAL_MS,
    "VITE_DASHBOARD_REFRESH_INTERVAL",
  );

const obtenerDevToken = (): string | null => {
  if (!import.meta.env.DEV) {
    return null;
  }

  const token = import.meta.env.VITE_DEV_TOKEN;
  return token ?? null;
};

export const ENV: EnvConfig = {
  API_URL: obtenerApiUrl(),
  API_REQUEST_TIMEOUT_MS: obtenerApiRequestTimeout(),
  API_RETRY_LIMIT: obtenerApiRetryLimit(),
  DASHBOARD_INTENTS_API_URL: obtenerDashboardIntentsApiUrl(),
  DASHBOARD_REFRESH_INTERVAL: obtenerRefreshInterval(),
  TOKEN_REFRESH_SKEW_MS: obtenerTokenRefreshSkew(),
  SESSION_INACTIVITY_TIMEOUT_MS: obtenerSessionInactivityTimeout(),
  DEV_TOKEN: obtenerDevToken(),
  IS_DEV: import.meta.env.DEV,
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL ?? DEFAULT_SUPPORT_EMAIL,
  DOCS_URL: import.meta.env.VITE_DOCS_URL ?? DEFAULT_DOCS_URL,
} as const;

export const validarEnv = (): void => {
  if (!ENV.API_URL) {
    throw new Error("Variable de entorno API_URL es requerida");
  }

  if (ENV.API_REQUEST_TIMEOUT_MS < MIN_TIMEOUT_MS) {
    throw new Error("API_REQUEST_TIMEOUT_MS debe ser >= 1000ms");
  }

  if (ENV.API_RETRY_LIMIT < 0) {
    throw new Error("API_RETRY_LIMIT debe ser >= 0");
  }

  if (ENV.DASHBOARD_REFRESH_INTERVAL < MIN_TIMEOUT_MS) {
    throw new Error("DASHBOARD_REFRESH_INTERVAL debe ser >= 1000ms");
  }

  if (ENV.TOKEN_REFRESH_SKEW_MS < MIN_TIMEOUT_MS) {
    throw new Error("TOKEN_REFRESH_SKEW_MS debe ser >= 1000ms");
  }

  if (ENV.SESSION_INACTIVITY_TIMEOUT_MS < MIN_TIMEOUT_MS) {
    throw new Error("SESSION_INACTIVITY_TIMEOUT_MS debe ser >= 1000ms");
  }
};
