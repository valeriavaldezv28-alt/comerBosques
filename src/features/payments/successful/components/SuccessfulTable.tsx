import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { StatusPill } from "@/components/ui/StatusPill";
import { claseTarjeta } from "@/shared/ui/estilosDashboard";
import type { Sale } from "../types/sale";
import {
  formatUnknownSuccessfulPaymentsStatus,
  getSuccessfulPaymentsStatusConfig,
  normalizeSuccessfulPaymentsStatus,
} from "../config/successfulPaymentsStatusConfig";

type SuccessfulTableProps = {
  transactions: Sale[];
  isLoading: boolean;
  emptyStateLabel: string;
  locale: string;
  formatDateTime: (value: string | null, locale: string) => string;
  formatCurrency: (amount: number | null, currency: string, locale: string) => string;
  tableAction?: ReactNode;
};

export const SuccessfulTable = ({
  transactions,
  isLoading,
  emptyStateLabel,
  locale,
  formatDateTime,
  formatCurrency,
  tableAction,
}: SuccessfulTableProps) => {
  const { t } = useTranslation();
  const translateStatus = (status: string): string => {
    const config = getSuccessfulPaymentsStatusConfig(status);
    const normalizedStatus = normalizeSuccessfulPaymentsStatus(status);

    return t(config.labelKey, {
      status: normalizedStatus ?? formatUnknownSuccessfulPaymentsStatus(status),
    });
  };

  return (
    <section className={claseTarjeta("base", "overflow-hidden")}>
      <div className="dashboard-card-header flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{t("successfulPayments.title")}</h2>
        {tableAction}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="w-14 px-4 py-3 text-left font-semibold text-foreground">#</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("successfulPayments.table.transaction")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("successfulPayments.table.order")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("successfulPayments.table.description")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("successfulPayments.table.card")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("successfulPayments.table.status")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("successfulPayments.table.createdAt")}</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">{t("successfulPayments.table.amount")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={`successful-sale-skeleton-${index}`} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 w-5 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-40 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-48 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-6 w-20 rounded-full bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="ml-auto h-4 w-20 rounded bg-muted" /></td>
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                  {emptyStateLabel}
                </td>
              </tr>
            ) : (
              transactions.map((transaction, index) => (
                <tr key={transaction.id} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium tabular-nums text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{transaction.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{transaction.orderId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{transaction.description}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {transaction.cardBrand} {transaction.lastFourDigits !== "-" ? `**** ${transaction.lastFourDigits}` : transaction.cardNumberMask}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={getSuccessfulPaymentsStatusConfig(transaction.status).variant}>
                      {translateStatus(transaction.status)}
                    </StatusPill>
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
