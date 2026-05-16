import type { PaginatedResponse } from "@/shared/api/pagination";

export type GmvErrorApiItem = Record<string, unknown>;

export type GmvErrorsApiResponse = Partial<PaginatedResponse<GmvErrorApiItem>>;

export type GmvErrorsQuery = {
  from?: string;
  to?: string;
  size: number;
  page?: number;
  cursor?: string | null;
  refreshKey?: number;
};

export type GmvError = {
  id: string;
  reference: string;
  customer: string;
  merchant: string;
  status: string;
  createdAt: string | null;
  amount: number | null;
  currency: string;
  detail: string;
};

export type GmvErrors = {
  data: GmvError[];
  total: number;
  cursor: string | null;
  nextCursor: string | null;
  size: number;
  hasMore: boolean;
};

export const GMV_ERRORS_SIZE = 3;
