import type {
  GmvError,
  GmvErrors,
  GmvErrorsApiResponse,
  GmvErrorApiItem,
} from "../types/gmvError";

const isRecord = (value: unknown): value is GmvErrorApiItem =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readPath = (source: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) {
      return undefined;
    }
    return current[segment];
  }, source as unknown);

const readString = (source: GmvErrorApiItem, paths: string[]): string | null => {
  for (const path of paths) {
    const value = readPath(source, path);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }
  return null;
};

const readNumber = (source: GmvErrorApiItem, paths: string[]): number | null => {
  for (const path of paths) {
    const value = readPath(source, path);
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value.replace(/,/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
};

const readArray = (source: GmvErrorsApiResponse, paths: string[]): GmvErrorApiItem[] | null => {
  for (const path of paths) {
    const value = readPath(source, path);
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }
  return null;
};

const resolveItems = (payload: GmvErrorsApiResponse): GmvErrorApiItem[] => {
  const nestedItems = readArray(payload, ["data", "items", "rows", "content", "errors", "errorResponses", "records", "result", "data.items", "data.rows", "data.content", "data.errors", "data.errorResponses", "result.items", "result.rows", "result.content", "result.errors"]);
  if (nestedItems) {
    return nestedItems;
  }
  return [];
};

const resolveTotal = (payload: GmvErrorsApiResponse, itemCount: number): number => {
  if (!isRecord(payload as unknown)) {
    return itemCount;
  }
  return readNumber(payload as unknown as GmvErrorApiItem, ["total", "totalRecords", "total_records", "totalElements", "total_elements", "pagination.total", "pagination.totalRecords", "pagination.total_records", "page.total", "page.totalElements", "data.total", "data.totalRecords", "data.total_records", "data.totalElements", "result.total", "result.totalRecords", "result.totalElements"]) ?? itemCount;
};

const resolveString = (payload: GmvErrorsApiResponse, paths: string[]): string | null => {
  if (!isRecord(payload as unknown)) {
    return null;
  }
  for (const path of paths) {
    const value = readPath(payload, path);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
};

const resolveBoolean = (payload: GmvErrorsApiResponse, paths: string[]): boolean | null => {
  if (!isRecord(payload as unknown)) {
    return null;
  }
  for (const path of paths) {
    const value = readPath(payload, path);
    if (typeof value === "boolean") {
      return value;
    }
  }
  return null;
};

const mapRejectedItem = (errorResponse: GmvErrorApiItem, index: number): GmvError => ({
  id: readString(errorResponse, ["id", "errorId", "error_id", "intentId", "intent_id", "transactionId", "transaction_id", "requestId", "request_id", "correlationId", "correlation_id", "uuid"]) ?? `error-${index + 1}`,
  reference: readString(errorResponse, ["reference", "referenceId", "reference_id", "orderId", "order_id", "path", "endpoint", "apiPath", "api_path"]) ?? "-",
  customer: readString(errorResponse, ["customer", "customerName", "customer_name", "customerEmail", "customer_email", "customer.email", "customer.name", "payer.email", "payer.name", "client.email", "client.name"]) ?? "-",
  merchant: readString(errorResponse, ["merchant", "merchantName", "merchant_name", "merchant.name", "storeName", "store_name", "commerceName", "commerce_name", "commerce.name"]) ?? "-",
  status: readString(errorResponse, ["status", "state", "errorCode", "error_code", "code", "httpStatus", "http_status", "statusCode", "status_code", "responseStatus", "response_status"]) ?? "ERROR",
  createdAt: readString(errorResponse, ["createdAt", "created_at", "created", "timestamp", "errorAt", "error_at", "updatedAt", "updated_at"]),
  amount: readNumber(errorResponse, ["amount", "total", "value", "gmv", "grossAmount", "gross_amount", "money.amount", "amount.value"]),
  currency: readString(errorResponse, ["currency", "currencyCode", "currency_code", "money.currency", "amount.currency"]) ?? "USD",
  detail: readString(errorResponse, ["message", "errorMessage", "error_message", "detail", "details", "reason", "description", "responseMessage", "response_message", "exception"]) ?? "-",
});

export const mapRejected = (payload: GmvErrorsApiResponse): GmvErrors => {
  const items = resolveItems(payload);
  const nextCursor = resolveString(payload, ["nextCursor", "next_cursor", "data.nextCursor", "result.nextCursor"]);

  return {
    data: items.map(mapRejectedItem),
    total: resolveTotal(payload, items.length),
    cursor: resolveString(payload, ["cursor", "data.cursor", "result.cursor"]),
    nextCursor,
    size: isRecord(payload as unknown) ? readNumber(payload as unknown as GmvErrorApiItem, ["size", "data.size", "result.size"]) ?? items.length : items.length,
    hasMore: resolveBoolean(payload, ["hasMore", "has_more", "data.hasMore", "result.hasMore"]) ?? Boolean(nextCursor),
  };
};
