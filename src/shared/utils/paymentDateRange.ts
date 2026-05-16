const padDatePart = (value: number): string => String(value).padStart(2, "0");
const ISO_TIME_ZONE_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i;

export const MIN_PAYMENT_FILTER_INPUT_DATE = "2026-05-01";

const formatUtcInputDate = (date: Date): string =>
  `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}`;

const parseInputDateAsUtc = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const getTodayInputDate = (date = new Date()): string => formatUtcInputDate(date);

export const clampPaymentFilterInputDate = (value: string): string =>
  value < MIN_PAYMENT_FILTER_INPUT_DATE ? MIN_PAYMENT_FILTER_INPUT_DATE : value;

export const getFirstUtcMonthInputDate = (date = new Date()): string =>
  `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-01`;

export const addDaysToInputDate = (value: string, days: number): string => {
  const date = parseInputDateAsUtc(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcInputDate(date);
};

export const toStartOfUtcDayIso = (value: string): string => `${value}T00:00:00Z`;

export const toExclusiveEndOfUtcDayIso = (value: string): string => {
  const date = parseInputDateAsUtc(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return `${formatUtcInputDate(date)}T00:00:00Z`;
};

export type UtcApiDateRange = {
  from: string;
  to: string;
};

export type UtcInputDateRange = {
  fromDate: string;
  toDate: string;
};

export const getUtcDateRange = (fromDate: string, toDate: string): UtcApiDateRange => ({
  from: toStartOfUtcDayIso(fromDate),
  to: toExclusiveEndOfUtcDayIso(toDate),
});

export const getUtcTodayRange = (date = new Date()): UtcApiDateRange => {
  const today = getTodayInputDate(date);
  return getUtcDateRange(today, today);
};

export const getUtcMonthToDateInputRange = (date = new Date()): UtcInputDateRange => ({
  fromDate: getFirstUtcMonthInputDate(date),
  toDate: getTodayInputDate(date),
});

export const formatPaymentDateTimeUtc = (value: string | null, locale: string): string => {
  if (!value) {
    return "-";
  }

  const normalizedValue = ISO_TIME_ZONE_PATTERN.test(value) ? value : `${value}Z`;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
};

export const formatPaymentDateUtc = (value: string | null, locale: string): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};
