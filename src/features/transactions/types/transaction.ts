export type TransactionStatus =
  | "approved"
  | "pending"
  | "failed"
  | "refunded";

export interface Transaction {
  id: string;
  merchant: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  method: string;
  createdAt: string;
}