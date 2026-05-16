import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { StatusPill } from "@/components/ui/StatusPill";
import { claseTarjeta } from "@/shared/ui/estilosDashboard";
import type { Refund } from "../types/refund";

type RefundsTableProps = {
  transactions: Refund[];
  isLoading: boolean;
  emptyStateLabel: string;
  locale: string;
  formatDateTime: (value: string | null, locale: string) => string;
  formatCurrency: (amount: number | null, currency: string, locale: string) => string;
  translateStatus: (status: string) => string;
  getStatusTone: (status: string) => "info" | "success" | "destructive" | "muted" | "warning";
  translateDescription: (description: string) => string;
  tableAction?: ReactNode;
};

export const RefundsTable = ({
  transactions,
  isLoading,
  emptyStateLabel,
  locale,
  formatDateTime,
  formatCurrency,
  translateStatus,
  translateDescription,
  getStatusTone,
  tableAction,
}: RefundsTableProps) => {
  const { t } = useTranslation();

  return (
    <section className={claseTarjeta("base", "overflow-hidden")}>
      <div className="dashboard-card-header flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{t("successfulSales.cards.refunds.title")}</h2>
        {tableAction}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="w-14 px-4 py-3 text-left font-semibold text-foreground">#</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("successfulSales.table.transaction")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("successfulSales.table.description")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("successfulSales.table.status")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("successfulSales.table.createdAt")}</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">{t("successfulSales.table.amount")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={`refund-skeleton-${index}`} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 w-5 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-56 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-6 w-24 rounded-full bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="ml-auto h-4 w-20 rounded bg-muted" /></td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={6}>
                  {emptyStateLabel}
                </td>
              </tr>
            ) : (
              transactions.map((transaction, index) => (
                <tr key={transaction.id} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium tabular-nums text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{transaction.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{translateDescription(transaction.description)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={getStatusTone(transaction.status)}>{translateStatus(transaction.status)}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(transaction.createdAt, locale)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    {formatCurrency(transaction.amount, transaction.currency, locale)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
