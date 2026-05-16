import type {
  Sale,
  Sales,
  SalesApiResponse,
  SaleApiItem,
  SuccessfulProcessedTotal,
  SuccessfulProcessedTotalApiResponse,
} from "../types/sale";

const isRecord = (value: unknown): value is SaleApiItem =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readPath = (source: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) {return undefined;}
    return current[segment];
  }, source as unknown);

const readString = (value: unknown, fallback = "-"): string => {
  if (typeof value === "string" && value.trim()) {return value.trim();}
  if (typeof value === "number" || typeof value === "boolean") {return String(value);}
  return fallback;
};

const readStringFromPaths = (source: SaleApiItem, paths: string[], fallback = "-"): string => {
  for (const path of paths) {
    const value = readPath(source, path);
    const parsed = readString(value, "");
    if (parsed) {return parsed;}
  }
  return fallback;
};

const readNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {return value;}
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const readNumberFromPaths = (source: SaleApiItem, paths: string[]): number | null => {
  for (const path of paths) {
    const parsed = readNumber(readPath(source, path));
    if (parsed !== null) {return parsed;}
  }
  return null;
};

const mapSale = (item: SaleApiItem, index: number): Sale => ({
  id: readStringFromPaths(item, ["id", "transactionId", "transaction_id"], `sale-${index + 1}`),
  orderId: readStringFromPaths(item, ["orderId", "order_id", "reference", "referenceId", "reference_id"]),
  transactionType: readStringFromPaths(item, ["transactionType", "transaction_type", "type", "operationType", "operation_type"]),
  description: readStringFromPaths(item, ["description", "detail", "message", "reason"]),
  cardBrand: readStringFromPaths(item, ["cardBrand", "card_brand", "brand", "payment.cardBrand"]),
  cardNumberMask: readStringFromPaths(item, ["cardNumberMask", "card_number_mask", "cardMask", "card_mask", "payment.cardNumberMask"]),
  lastFourDigits: readStringFromPaths(item, ["lastFourDigits", "last_four_digits", "last4", "cardLast4", "card_last4"]),
  status: readStringFromPaths(item, ["status", "state", "transactionStatus", "transaction_status"], "UNKNOWN"),
  amount: readNumberFromPaths(item, ["amount", "total", "value", "money.amount"]),
  currency: readStringFromPaths(item, ["currency", "currencyCode", "currency_code", "money.currency"], "USD"),
  createdAt: readStringFromPaths(item, ["createdAt", "created_at", "created"], "") || null,
});

export const mapSuccessful = (payload: SalesApiResponse): Sales => {
  const items = Array.isArray(payload.items) ? payload.items : [];

  return {
    cursor: payload.cursor ?? null,
    nextCursor: payload.nextCursor ?? null,
    size: payload.size ?? items.length,
    hasMore: payload.hasMore ?? Boolean(payload.nextCursor),
    items: items.map(mapSale),
  };
};

export const mapSuccessfulProcessedTotal = (
  payload: SuccessfulProcessedTotalApiResponse,
): SuccessfulProcessedTotal => ({
  totalRecords: readNumber(payload.totalRecords),
  total: readNumber(payload.total),
});
