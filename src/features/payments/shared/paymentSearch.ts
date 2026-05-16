import {
  getUtcDateRange,
  getUtcMonthToDateInputRange,
  type UtcApiDateRange,
  type UtcInputDateRange,
} from "@/shared/utils/paymentDateRange";

export const normalizePaymentSearchTerm = (value: string): string => value.trim().toLowerCase();

const TRANSACTION_ID_PATTERN = /^TRX-(\d{14})-[a-zA-Z0-9]+-(\d{1,4})$/;
const ORDER_ID_PATTERN = /^ORD-[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
const MIN_TRANSACTION_SEQUENCE = 1;
const MAX_TRANSACTION_SEQUENCE = 1000;
export type PaymentSearchTermType = "transactionId" | "orderId";

const isValidTransactionDateTime = (value: string): boolean => {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const hour = Number(value.slice(8, 10));
  const minute = Number(value.slice(10, 12));
  const second = Number(value.slice(12, 14));
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
    && date.getUTCHours() === hour
    && date.getUTCMinutes() === minute
    && date.getUTCSeconds() === second;
};

export const isValidTransactionSearchTerm = (value: string): boolean => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return true;
  }

  const match = normalizedValue.match(TRANSACTION_ID_PATTERN);
  const sequence = Number(match?.[2]);

  return Boolean(
    match?.[1]
    && isValidTransactionDateTime(match[1])
    && Number.isInteger(sequence)
    && sequence >= MIN_TRANSACTION_SEQUENCE
    && sequence <= MAX_TRANSACTION_SEQUENCE,
  );
};

export const isValidOrderSearchTerm = (value: string): boolean => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return true;
  }

  return ORDER_ID_PATTERN.test(normalizedValue);
};

export const getPaymentSearchTermType = (value: string): PaymentSearchTermType | null => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (isValidTransactionSearchTerm(normalizedValue)) {
    return "transactionId";
  }

  if (isValidOrderSearchTerm(normalizedValue)) {
    return "orderId";
  }

  return null;
};

export const isValidPaymentSearchTerm = (value: string): boolean => {
  const normalizedValue = value.trim();

  return !normalizedValue || getPaymentSearchTermType(normalizedValue) !== null;
};

export const getTransactionSearchInputDate = (value: string): string | null => {
  if (!isValidTransactionSearchTerm(value)) {
    return null;
  }

  const match = value.trim().match(TRANSACTION_ID_PATTERN);
  const rawDateTime = match?.[1];

  if (!rawDateTime) {
    return null;
  }

  return `${rawDateTime.slice(0, 4)}-${rawDateTime.slice(4, 6)}-${rawDateTime.slice(6, 8)}`;
};

export const getTransactionSearchDateRange = (value: string): UtcApiDateRange | null => {
  const inputDate = getTransactionSearchInputDate(value);

  if (!inputDate) {
    return null;
  }

  return getUtcDateRange(inputDate, inputDate);
};

export const getOrderSearchInputDateRange = (): UtcInputDateRange => getUtcMonthToDateInputRange();

export const getPaymentSearchInputDateRange = (value: string): UtcInputDateRange | null => {
  const termType = getPaymentSearchTermType(value);

  if (termType === "orderId") {
    return getOrderSearchInputDateRange();
  }

  const transactionDate = getTransactionSearchInputDate(value);

  if (!transactionDate) {
    return null;
  }

  return {
    fromDate: transactionDate,
    toDate: transactionDate,
  };
};

export const getPaymentSearchDateRange = (value: string): UtcApiDateRange | null => {
  const termType = getPaymentSearchTermType(value);

  if (termType === "transactionId") {
    return getTransactionSearchDateRange(value);
  }

  if (termType === "orderId") {
    const { fromDate, toDate } = getOrderSearchInputDateRange();
    return getUtcDateRange(fromDate, toDate);
  }

  return null;
};

export const isRefundTransactionStatus = (status: string): boolean =>
  status.trim().toLowerCase().includes("refund");

export const isRejectedTransactionStatus = (status: string): boolean => {
  const normalizedStatus = status.trim().toLowerCase();

  return normalizedStatus.includes("declin")
    || normalizedStatus.includes("fail")
    || normalizedStatus.includes("reject")
    || normalizedStatus.includes("error")
    || normalizedStatus.includes("chargeback")
    || normalizedStatus.includes("disput");
};

export const isSuccessfulTransactionStatus = (status: string): boolean => {
  const normalizedStatus = status.trim().toLowerCase();

  return normalizedStatus.includes("settled")
    || normalizedStatus.includes("authorized")
    || normalizedStatus.includes("success");
};

export const matchesPaymentSearch = (searchTerm: string, fields: Array<number | string | null | undefined>): boolean => {
  const normalizedSearchTerm = normalizePaymentSearchTerm(searchTerm);

  if (!normalizedSearchTerm) {
    return true;
  }

  return fields.some((field) => String(field ?? "").toLowerCase().includes(normalizedSearchTerm));
};
