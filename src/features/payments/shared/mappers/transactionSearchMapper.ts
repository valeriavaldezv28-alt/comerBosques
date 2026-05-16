import type { GmvError } from "@/features/payments/rejected/types/gmvError";
import type { PaymentIntent } from "@/features/payments/attempts/types/paymentIntent";
import type { Refund } from "@/features/payments/refunds/types/refund";
import type { Sale } from "@/features/payments/successful/types/sale";
import type {
  TransactionSearchApiItem,
  TransactionSearchApiResponse,
  TransactionSearchResult,
  TransactionSearchResultItem,
} from "../types/transactionSearch";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readPath = (source: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[segment];
  }, source);

const readString = (value: unknown, fallback = "-"): string => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
};

const readStringFromPaths = (source: TransactionSearchApiItem, paths: string[], fallback = "-"): string => {
  for (const path of paths) {
    const parsed = readString(readPath(source, path), "");

    if (parsed) {
      return parsed;
    }
  }

  return fallback;
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toMinorUnits = (amount: number | null): number | null =>
  amount === null ? null : Math.round(amount * 100);

const mapTransactionSearchItem = (item: TransactionSearchApiItem): TransactionSearchResultItem => {
  const amount = readNumber(readPath(item, "amount"));
  const transactionId = readStringFromPaths(item, ["transactionId", "transaction_id", "pspTransactionId", "id"]);

  return {
    transactionId,
    orderId: readStringFromPaths(item, ["orderId", "order_id", "reference", "referenceId", "reference_id"]),
    description: readStringFromPaths(item, ["description", "detail", "message", "reason"]),
    status: readStringFromPaths(item, ["status", "state", "transactionStatus", "transaction_status"], "UNKNOWN"),
    amount,
    amountMinorUnits: toMinorUnits(amount),
    currency: readStringFromPaths(item, ["currency", "currencyCode", "currency_code"], "USD"),
    createdAt: readStringFromPaths(item, ["createdAt", "created_at", "created"], "") || null,
    merchantId: readStringFromPaths(item, ["merchantId", "merchant_id", "merchant.id", "merchant"]),
    cardBrand: readStringFromPaths(item, ["cardBrand", "card_brand", "brand", "payment.cardBrand"]),
    cardNumberMask: readStringFromPaths(item, ["cardNumberMask", "card_number_mask", "cardMask", "card_mask", "payment.cardNumberMask"]),
    lastFourDigits: readStringFromPaths(item, ["lastFourDigits", "last_four_digits", "last4", "cardLast4", "card_last4"]),
  };
};

export const mapTransactionSearch = (payload: TransactionSearchApiResponse): TransactionSearchResult => {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const nextCursor = payload.nextCursor ?? null;

  return {
    cursor: payload.cursor ?? null,
    nextCursor,
    size: payload.size ?? items.length,
    hasMore: payload.hasMore ?? Boolean(nextCursor),
    items: items.map(mapTransactionSearchItem),
  };
};

const mapRoxStatusToIntentStatus = (status: string): string => {
  const normalizedStatus = status.trim().toLowerCase();

  if (
    normalizedStatus.includes("settled")
    || normalizedStatus.includes("authorized")
    || normalizedStatus.includes("refund")
  ) {
    return "SUCCEEDED";
  }

  return status;
};

export const transactionSearchItemToPaymentIntent = (item: TransactionSearchResultItem): PaymentIntent => ({
  id: item.transactionId,
  orderId: item.orderId,
  transactionId: item.transactionId,
  merchantId: item.merchantId,
  status: mapRoxStatusToIntentStatus(item.status),
  createdAt: item.createdAt,
  amountMinorUnits: item.amountMinorUnits,
});

export const transactionSearchItemToSale = (item: TransactionSearchResultItem): Sale => ({
  id: item.transactionId,
  orderId: item.orderId,
  transactionType: "Payment",
  description: item.description,
  cardBrand: item.cardBrand,
  cardNumberMask: item.cardNumberMask,
  lastFourDigits: item.lastFourDigits,
  status: item.status,
  amount: item.amount,
  currency: item.currency,
  createdAt: item.createdAt,
});

export const transactionSearchItemToRefund = (item: TransactionSearchResultItem): Refund => ({
  id: item.transactionId,
  orderId: item.orderId,
  transactionType: "Refund",
  description: item.description,
  cardBrand: item.cardBrand,
  cardNumberMask: item.cardNumberMask,
  lastFourDigits: item.lastFourDigits,
  status: item.status,
  amount: item.amount,
  currency: item.currency,
  createdAt: item.createdAt,
});

export const transactionSearchItemToGmvError = (item: TransactionSearchResultItem): GmvError => ({
  id: item.transactionId,
  reference: item.orderId,
  customer: "-",
  merchant: item.merchantId,
  status: item.status,
  createdAt: item.createdAt,
  amount: item.amountMinorUnits,
  currency: item.currency,
  detail: item.description,
});
