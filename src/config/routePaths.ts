export const ROUTE_PATHS = {
  root: "/",
  login: "/login",
  dashboard: "/dashboard",
  paymentIntents: "/dashboard/payment-intents",
  paymentAttempts: "/dashboard/payment-attempts",
  rejectedTransactions: "/dashboard/rejected-transactions",
  successfulPayments: "/dashboard/successful-payments",
  refunds: "/dashboard/refunds",
  transactions: "/transactions",
} as const;

export const PROTECTED_ROUTE_PATHS = {
  dashboard: "dashboard",
  paymentIntents: "dashboard/payment-intents",
  paymentAttempts: "dashboard/payment-attempts",
  rejectedTransactions: "dashboard/rejected-transactions",
  successfulPayments: "dashboard/successful-payments",
  refunds: "dashboard/refunds",
  transactions: "transactions",
} as const;
