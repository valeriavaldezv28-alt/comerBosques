import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { StatusPill } from "@/components/ui/StatusPill";
import { claseTarjeta } from "@/shared/ui/estilosDashboard";
import type { PaymentIntent } from "../types/paymentIntent";

type IntentsTableProps = {
  records: PaymentIntent[];
  isLoading: boolean;
  emptyStateLabel: string;
  locale: string;
  formatDateTime: (value: string | null, locale: string) => string;
  formatAmount: (record: PaymentIntent, locale: string) => string;
  translateStatus: (status: string) => string;
  getStatusTone: (status: string) => "info" | "success" | "destructive" | "muted" | "warning";
  tableAction?: ReactNode;
};

export const IntentsTable = ({
  records,
  isLoading,
  emptyStateLabel,
  locale,
  formatDateTime,
  formatAmount,
  translateStatus,
  getStatusTone,
  tableAction,
}: IntentsTableProps) => {
  const { t } = useTranslation();

  return (
    <section className={claseTarjeta("base", "overflow-hidden")}>
      <div className="dashboard-card-header flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{t("dashboard.gmvDetail.table.title")}</h2>
        {tableAction}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="w-14 px-4 py-3 text-left font-semibold text-foreground">#</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("dashboard.gmvDetail.table.id")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("dashboard.gmvDetail.table.orderId")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("dashboard.gmvDetail.table.transactionId")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("dashboard.gmvDetail.table.merchantId")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("dashboard.gmvDetail.table.status")}</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">{t("dashboard.gmvDetail.table.createdAt")}</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">{t("dashboard.gmvDetail.table.amount")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={`intent-skeleton-${index}`} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 w-5 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-36 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-6 w-20 rounded-full bg-muted" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-muted" /></td>
                  <td className="px-4 py-3"><div className="ml-auto h-4 w-24 rounded bg-muted" /></td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={8}>
                  {emptyStateLabel}
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr key={`${record.id}-${index}`} className="transition hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium tabular-nums text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{record.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">{record.orderId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{record.transactionId}</td>
                  <td className="px-4 py-3 text-muted-foreground">{record.merchantId}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={getStatusTone(record.status)}>{translateStatus(record.status)}</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDateTime(record.createdAt, locale)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{formatAmount(record, locale)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
