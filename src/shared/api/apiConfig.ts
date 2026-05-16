import { ENV } from "@/shared/config/env";

export const API_BASE_URL = ENV.API_URL;

export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
  },
  dashboard: {
    kpis: "/dashboard/kpis",
    hourly: "/dashboard/hourly",
    intents: "/dashboard/intents",
    errorResponses: "/dashboard/error-responses",
    refundTransactions: "/dashboard/refund-transactions",
    roxTransactions: "/dashboard/rox-transactions",
    processedTotal: "/dashboard/processed-total",
    pulse: "/dashboard/pulse",
    statusDistribution: "/dashboard/status-distribution",
  },
} as const;

export const DEFAULT_API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
} as const;
