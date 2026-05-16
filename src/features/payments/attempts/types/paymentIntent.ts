export type PaymentIntentApiItem = {
  id?: number | string | null;
  orderId?: string | null;
  transactionId?: string | null;
  merchantId?: string | null;
  status?: string | null;
  createdAt?: string | null;
  amount?: number | string | null;
};

export type PaymentIntentsApiResponse =
  | PaymentIntentApiItem[]
  | {
      data?: PaymentIntentApiItem[] | null;
      items?: PaymentIntentApiItem[] | null;
      total?: number | null;
      cursor?: string | null;
      nextCursor?: string | null;
      size?: number | null;
      hasMore?: boolean | null;
    };

export type PaymentIntentsQuery = {
  from?: string;
  to?: string;
  status?: string | string[];
  size: number;
  page?: number;
  cursor?: string | null;
  refreshKey?: number;
};

export type PaymentIntent = {
  id: string;
  orderId: string;
  transactionId: string;
  merchantId: string;
  status: string;
  createdAt: string | null;
  amountMinorUnits: number | null;
};

export type PaymentIntents = {
  data: PaymentIntent[];
  total: number;
  cursor: string | null;
  nextCursor: string | null;
  size: number;
  hasMore: boolean;
};

export const PAYMENT_INTENTS_STATUS = "LINK_CREATED";
export const PAYMENT_INTENTS_INITIAL_SIZE = 3;
export const PAYMENT_INTENTS_LOAD_MORE_SIZE = 3;
