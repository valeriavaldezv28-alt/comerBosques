import type { PaginatedResponse } from "@/shared/api/pagination";

export type RefundApiItem = Record<string, unknown> & {
  transactionType?: string | null;
  createdAt?: string | null;
  amount?: number | string | null;
  refundAmount?: number | string | null;
  orderId?: string | null;
  lastFourDigits?: string | number | null;
  description?: string | null;
  currency?: string | null;
  id?: string | null;
  refundId?: string | null;  pspTransactionId?: string | null;  cardBrand?: string | null;
  cardNumberMask?: string | null;
  status?: string | null;
};

export type RefundsApiResponse = Partial<PaginatedResponse<RefundApiItem>>;

export type RefundsQuery = {
  cursor?: string | null;
  from: string;
  to: string;
  size: number;
  refreshKey?: number;
};

export type Refund = {
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

export type Refunds = {
  cursor: string | null;
  nextCursor: string | null;
  size: number;
  hasMore: boolean;
  items: Refund[];
};

export const REFUNDS_SIZE = 3;
