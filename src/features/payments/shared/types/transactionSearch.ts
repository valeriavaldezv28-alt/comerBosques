import type { PaginatedResponse } from "@/shared/api/pagination";

export type TransactionSearchApiItem = Record<string, unknown> & {
  id?: string | number | null;
  transactionId?: string | null;
  transaction_id?: string | null;
  pspTransactionId?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  amount?: number | string | null;
  orderId?: string | null;
  order_id?: string | null;
  description?: string | null;
  currency?: string | null;
  merchantId?: string | null;
  merchant_id?: string | null;
  cardBrand?: string | null;
  card_brand?: string | null;
  cardNumberMask?: string | null;
  card_number_mask?: string | null;
  lastFourDigits?: string | number | null;
  last_four_digits?: string | number | null;
  status?: string | null;
};

export type TransactionSearchApiResponse = Partial<PaginatedResponse<TransactionSearchApiItem>>;

export type TransactionSearchQuery = {
  transactionId?: string;
  orderId?: string;
  from: string;
  to: string;
  size: number;
  cursor?: string | null;
};

export type TransactionSearchResultItem = {
  transactionId: string;
  orderId: string;
  description: string;
  status: string;
  amount: number | null;
  amountMinorUnits: number | null;
  currency: string;
  createdAt: string | null;
  merchantId: string;
  cardBrand: string;
  cardNumberMask: string;
  lastFourDigits: string;
};

export type TransactionSearchResult = {
  cursor: string | null;
  nextCursor: string | null;
  size: number;
  hasMore: boolean;
  items: TransactionSearchResultItem[];
};
