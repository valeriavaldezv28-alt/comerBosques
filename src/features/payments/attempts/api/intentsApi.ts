import { apiClient } from "@/shared/api/apiClient";
import { ENV } from "@/shared/config/env";
import type { PaymentIntentsApiResponse, PaymentIntentsQuery } from "../types/paymentIntent";

const DEFAULT_DASHBOARD_INTENTS_ENDPOINT = "/dashboard/intents";

const buildIntentsEndpoint = (query: PaymentIntentsQuery, endpoint: string): string => {
  const searchParams = new URLSearchParams();
  searchParams.set("size", String(query.size));

  if (query.cursor) {
    searchParams.set("cursor", query.cursor);
  }

  if (query.status) {
    if (Array.isArray(query.status)) {
      query.status
        .map((status) => status.trim())
        .filter(Boolean)
        .forEach((status) => {
          searchParams.append("status", status);
        });
    } else {
      searchParams.set("status", query.status);
    }
  }

  if (query.from) {
    searchParams.set("from", query.from);
  }

  if (query.to) {
    searchParams.set("to", query.to);
  }

  if (query.page !== undefined) {
    searchParams.set("page", String(query.page));
  }

  return `${endpoint}?${searchParams.toString()}`;
};

export const fetchIntents = async (query: PaymentIntentsQuery): Promise<PaymentIntentsApiResponse> =>
  apiClient<PaymentIntentsApiResponse>(
    buildIntentsEndpoint(query, ENV.DASHBOARD_INTENTS_API_URL ?? DEFAULT_DASHBOARD_INTENTS_ENDPOINT),
  );
