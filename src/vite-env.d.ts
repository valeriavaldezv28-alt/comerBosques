/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_REQUEST_TIMEOUT_MS?: string;
  readonly VITE_API_RETRY_LIMIT?: string;
  readonly VITE_DASHBOARD_REFRESH_INTERVAL?: string;
  readonly VITE_TOKEN_REFRESH_SKEW_MS?: string;
  readonly VITE_SESSION_INACTIVITY_TIMEOUT_MS?: string;
  readonly VITE_DEV_TOKEN?: string;
  readonly VITE_SUPPORT_EMAIL?: string;
  readonly VITE_DOCS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
