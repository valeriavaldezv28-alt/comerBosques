import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { claseTarjeta } from "@/shared/ui/estilosDashboard";
import { downloadCsv } from "@/shared/utils/csvDownload";
import { transactionsService } from "../services/transactionsService";
import type { Transaction } from "../types/transaction";

const Transactions = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<Transaction[]>([]);

  useEffect(() => {
    transactionsService.getTransactions().then(setData);
  }, []);

  const handleDownloadCsv = () => {
    downloadCsv(
      [
        [
          "#",
          t("transactions.table.headers.id"),
          t("transactions.table.headers.merchant"),
          t("transactions.table.headers.merchantId"),
          t("transactions.table.headers.amount"),
          t("transactions.table.headers.currency"),
          t("transactions.table.headers.status"),
          t("transactions.table.headers.method"),
          t("transactions.table.headers.createdAt"),
        ],
        ...data.map((tx, index) => [
          index + 1,
          tx.id,
          tx.merchant,
          tx.merchantId,
          tx.amount,
          tx.currency,
          t(`transactions.status.${tx.status}`),
          tx.method,
          tx.createdAt,
        ]),
      ],
      t("transactions.filename"),
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("transactions.title")}</h1>

      <section className={claseTarjeta("base", "overflow-hidden")}>
        <div className="dashboard-card-header flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">{t("transactions.title")}</h2>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-secondary"
          >
            <Download className="h-3.5 w-3.5" />
            {t("common.actions.downloadCsv")}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="w-14 px-4 py-3 text-left font-semibold text-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">{t("transactions.table.headers.id")}</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">{t("transactions.table.headers.merchant")}</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">{t("transactions.table.headers.amount")}</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">{t("transactions.table.headers.status")}</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">{t("transactions.table.headers.method")}</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">{t("transactions.table.headers.createdAt")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={7}>
                    {t("transactions.empty")}
                  </td>
                </tr>
              ) : (
                data.map((tx, index) => (
                  <tr key={tx.id} className="transition hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium tabular-nums text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{tx.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.merchant}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tx.currency} {tx.amount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t(`transactions.status.${tx.status}`)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.method}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.createdAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Transactions;
