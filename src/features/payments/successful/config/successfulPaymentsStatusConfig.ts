type SuccessfulPaymentsStatusVariant = "info" | "success" | "destructive" | "muted" | "warning";

type SuccessfulPaymentsStatusConfig = {
  labelKey: string;
  variant: SuccessfulPaymentsStatusVariant;
};

export const SUCCESSFUL_PAYMENTS_STATUS_CONFIG = {
  Settled: {
    labelKey: "successfulPayments.status.settled",
    variant: "success",
  },
  Authorized: {
    labelKey: "successfulPayments.status.authorized",
    variant: "info",
  },
  Declined: {
    labelKey: "successfulPayments.status.declined",
    variant: "destructive",
  },
  Refunded: {
    labelKey: "successfulPayments.status.refunded",
    variant: "warning",
  },
  Chargeback: {
    labelKey: "successfulPayments.status.chargeback",
    variant: "destructive",
  },
  Disputed: {
    labelKey: "successfulPayments.status.disputed",
    variant: "warning",
  },
  PartiallyRefunded: {
    labelKey: "successfulPayments.status.partiallyRefunded",
    variant: "warning",
  },
  Failed: {
    labelKey: "successfulPayments.status.failed",
    variant: "destructive",
  },
  Pending: {
    labelKey: "successfulPayments.status.pending",
    variant: "info",
  },
} as const satisfies Record<string, SuccessfulPaymentsStatusConfig>;

export type SuccessfulPaymentsStatus = keyof typeof SUCCESSFUL_PAYMENTS_STATUS_CONFIG;
export type SuccessfulPaymentsStatusConfigItem =
  (typeof SUCCESSFUL_PAYMENTS_STATUS_CONFIG)[SuccessfulPaymentsStatus];
export type SuccessfulPaymentsStatusVariantType =
  SuccessfulPaymentsStatusConfigItem["variant"];

export const SUCCESSFUL_PAYMENTS_PRIMARY_STATUS: SuccessfulPaymentsStatus = "Settled";

export const SUCCESSFUL_PAYMENTS_FILTER_STATUSES = [
  "Settled",
] as const satisfies readonly SuccessfulPaymentsStatus[];

const UNKNOWN_SUCCESSFUL_PAYMENTS_STATUS_CONFIG = {
  labelKey: "successfulPayments.status.unknown",
  variant: "muted",
} as const satisfies SuccessfulPaymentsStatusConfig;

export const isSuccessfulPaymentsStatus = (
  status: string,
): status is SuccessfulPaymentsStatus =>
  status in SUCCESSFUL_PAYMENTS_STATUS_CONFIG;

export const normalizeSuccessfulPaymentsStatus = (
  status: string,
): SuccessfulPaymentsStatus | null => {
  const normalizedStatus = status.trim().toLowerCase().replace(/[\s_-]+/g, "");
  const matchingStatus = (Object.keys(SUCCESSFUL_PAYMENTS_STATUS_CONFIG) as SuccessfulPaymentsStatus[]).find(
    (supportedStatus) => supportedStatus.toLowerCase() === normalizedStatus,
  );

  return matchingStatus ?? null;
};

export const getSuccessfulPaymentsStatusConfig = (
  status: string,
): SuccessfulPaymentsStatusConfigItem | typeof UNKNOWN_SUCCESSFUL_PAYMENTS_STATUS_CONFIG => {
  const normalizedStatus = normalizeSuccessfulPaymentsStatus(status);

  return normalizedStatus
    ? SUCCESSFUL_PAYMENTS_STATUS_CONFIG[normalizedStatus]
    : UNKNOWN_SUCCESSFUL_PAYMENTS_STATUS_CONFIG;
};

export const formatUnknownSuccessfulPaymentsStatus = (status: string): string =>
  status
    .toLowerCase()
    .split(/[\s_ -]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
