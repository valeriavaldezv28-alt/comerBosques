import type { PaymentIntent, PaymentIntentApiItem, PaymentIntents, PaymentIntentsApiResponse } from "../types/paymentIntent";

const toText = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const mapIntent = (item: PaymentIntentApiItem, index: number): PaymentIntent => ({
  id: toText(item.id) ?? `intent-${index + 1}`,
  orderId: toText(item.orderId) ?? "-",
  transactionId: toText(item.transactionId) ?? "-",
  merchantId: toText(item.merchantId) ?? "-",
  status: toText(item.status) ?? "UNKNOWN",
  createdAt: toText(item.createdAt),
  amountMinorUnits: toNumber(item.amount),
});

export const mapIntents = (payload: PaymentIntentsApiResponse): PaymentIntents => {
  const items = Array.isArray(payload) ? payload : payload.items ?? payload.data ?? [];
  const safeItems = Array.isArray(items) ? items : [];
  const total = Array.isArray(payload) ? safeItems.length : payload.total ?? safeItems.length;
  const nextCursor = Array.isArray(payload) ? null : payload.nextCursor ?? null;

  return {
    data: safeItems.map(mapIntent),
    total,
    cursor: Array.isArray(payload) ? null : payload.cursor ?? null,
    nextCursor,
    size: Array.isArray(payload) ? safeItems.length : payload.size ?? safeItems.length,
    hasMore: Array.isArray(payload) ? false : payload.hasMore ?? Boolean(nextCursor),
  };
};
