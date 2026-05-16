import type { PaginatedResponse } from "@/shared/api/pagination";
import type { SuccessfulPaymentsStatus } from "../config/successfulPaymentsStatusConfig";

export type SaleApiItem = Record<string, unknown> & {
  transactionType?: string | null;
  createdAt?: string | null;
  amount?: number | string | null;
  orderId?: string | null;
  lastFourDigits?: string | number | null;
  description?: string | null;
  currency?: string | null;
  id?: string | null;
  cardBrand?: string | null;
  cardNumberMask?: string | null;
  status?: string | null;
};

export type SalesApiResponse = Partial<PaginatedResponse<SaleApiItem>>;

export type SalesQuery = {
  cursor?: string | null;
  from: string;
  to: string;
  size: number;
  status?: SuccessfulPaymentsStatus;
  refreshKey?: number;
};

export type SuccessfulProcessedTotalApiResponse = {
  totalRecords?: number | string | null;
  total?: number | string | null;
};

export type SuccessfulProcessedTotalQuery = {
  from: string;
  to: string;
  refreshKey?: number;
};

export type SuccessfulProcessedTotal = {
  totalRecords: number | null;
  total: number | null;
};

export type Sale = {
  id: string;
  orderId: string;
  transactionType: string;
  description: string;
  cardBrand: string;
  cardNumberMask: string;
  lastFourDigits: string;
  status: string;
  amount: number | null;
  currency: string;
  createdAt: string | null;
};

export type Sales = {
  cursor: string | null;
  nextCursor: string | null;
  size: number;
  hasMore: boolean;
  items: Sale[];
};

export const SALES_API_SIZE = 100;
export const SALES_INITIAL_SIZE = 3;
export const SALES_LOAD_MORE_SIZE = 3;
