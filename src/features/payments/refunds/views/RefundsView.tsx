import { ArrowLeft, CalendarDays, Check, Download } from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/config/routePaths";
import { GmvTotalMetricCard } from "@/components/ui/GmvTotalMetricCard";
import { claseTarjeta } from "@/shared/ui/estilosDashboard";
import { downloadCsv } from "@/shared/utils/csvDownload";
import {
  addDaysToInputDate,
  clampPaymentFilterInputDate,
  formatPaymentDateTimeUtc,
  getTodayInputDate,
  MIN_PAYMENT_FILTER_INPUT_DATE,
  toExclusiveEndOfUtcDayIso,
  toStartOfUtcDayIso,
} from "@/shared/utils/paymentDateRange";
import { RefundsTable } from "../components/RefundsTable";
import { useRefunds } from "../hooks/useRefunds";
import { REFUNDS_SIZE, type Refund, type RefundsQuery } from "../types/refund";

type PeriodMode = "today" | "yesterday";
type PeriodRange = { fromDate: string; toDate: string };
const periodModes: PeriodMode[] = ["today", "yesterday"];
const formatCurrency = (amount: number | null, currency: string, locale: string): string => {
  if (amount === null) {return "-";}
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
};
const formatNumber = (value: number, locale: string): string => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
const formatFallbackStatus = (status: string): string => status.toLowerCase().split(/[\s_ -]+/).filter(Boolean).map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" ");

const RefundsView = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.resolvedLanguage === "es" ? "es-MX" : "en-US";
  const todayInputDate = getTodayInputDate();
  const initialFromDate = todayInputDate;
  const [draftFromDate, setDraftFromDate] = useState(initialFromDate);
  const [draftToDate, setDraftToDate] = useState(todayInputDate);
  const [appliedRange, setAppliedRange] = useState<PeriodRange>({ fromDate: initialFromDate, toDate: todayInputDate });
  const [cursor, setCursor] = useState<string | null>(null);
  const [accumulatedTransactions, setAccumulatedTransactions] = useState<Refund[]>([]);
  const [invalidRangeApplied, setInvalidRangeApplied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasInvalidDateRange = draftFromDate > draftToDate;
  const hasAppliedInvalidDateRange = appliedRange.fromDate > appliedRange.toDate;
  const invalidDateLabel = locale === "es-MX" ? "no hay datos" : "no data";
  const query = useMemo<RefundsQuery>(() => ({ from: toStartOfUtcDayIso(appliedRange.fromDate), to: toExclusiveEndOfUtcDayIso(appliedRange.toDate), size: REFUNDS_SIZE, cursor, refreshKey }), [appliedRange, cursor, refreshKey]);
  const refundsResult = useRefunds(query, !hasAppliedInvalidDateRange);
  const pageTransactions = useMemo(() => refundsResult.data?.items ?? [], [refundsResult.data?.items]);
  const transactions = useMemo(() => invalidRangeApplied ? [] : accumulatedTransactions, [accumulatedTransactions, invalidRangeApplied]);
  const totalAmount = useMemo(() => transactions.reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0), [transactions]);
  const currency = transactions.find((transaction) => transaction.currency)?.currency ?? "USD";
  const errorMessage = refundsResult.error instanceof Error ? refundsResult.error.message : t("successfulSales.errors.refunds");
  const emptyStateLabel = invalidRangeApplied ? invalidDateLabel : t("successfulSales.emptyStates.refunds");
  const isLoadingTransactions = refundsResult.isLoading;
  const isFetchingTransactions = refundsResult.isFetching;
  const isErrorTransactions = refundsResult.isError;

  useEffect(() => { setCursor(null); setAccumulatedTransactions([]); }, [appliedRange.fromDate, appliedRange.toDate]);
  useEffect(() => {
    if (!refundsResult.data) {return;}
    setAccumulatedTransactions((currentTransactions) => {
      if (!cursor) {return pageTransactions;}
      const existingIds = new Set(currentTransactions.map((transaction) => transaction.id));
      const nextTransactions = pageTransactions.filter((transaction) => !existingIds.has(transaction.id));
      return [...currentTransactions, ...nextTransactions];
    });
  }, [cursor, pageTransactions, refundsResult.data]);

  const handleDateKeyDown = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key !== "Tab") {event.preventDefault();} };
  const handleDatePointerDown = (event: PointerEvent<HTMLInputElement>) => { const input = event.currentTarget; if ("showPicker" in input) {input.showPicker();} };
  const handleApplyDateFilter = () => {
    const nextFromDate = clampPaymentFilterInputDate(draftFromDate);
    const nextToDate = clampPaymentFilterInputDate(draftToDate);
    if (nextFromDate > nextToDate) { setInvalidRangeApplied(true); setCursor(null); setAccumulatedTransactions([]); return; }
    setInvalidRangeApplied(false); setCursor(null); setAccumulatedTransactions([]); setDraftFromDate(nextFromDate); setDraftToDate(nextToDate); setAppliedRange({ fromDate: nextFromDate, toDate: nextToDate }); setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  };
  const handlePeriodModeChange = (periodMode: PeriodMode) => {
    const nextDate = clampPaymentFilterInputDate(periodMode === "today" ? todayInputDate : addDaysToInputDate(todayInputDate, -1));
    setInvalidRangeApplied(false); setDraftFromDate(nextDate); setDraftToDate(nextDate); setAppliedRange({ fromDate: nextDate, toDate: nextDate }); setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  };
  const handleLoadMore = () => { if (refundsResult.data?.nextCursor) {setCursor(refundsResult.data.nextCursor);} };
  const translateStatus = (status: string): string =>
    status.toLowerCase().includes("refund")
      ? t("successfulSales.statusValues.refunded")
      : t("successfulSales.statusValues.unknown", { status: formatFallbackStatus(status) });
  const translateDescription = (description: string): string => {
    const normalizedDescription = description.trim().toLowerCase();
    switch (normalizedDescription) {
      case "reembolso de prueba":
        return t("refunds.descriptions.refundTest");
      default:
        return description;
    }
  };
  const getTransactionStatusTone = (status: string): "info" | "success" | "destructive" | "muted" | "warning" => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes("refund") || normalizedStatus.includes("settled") || normalizedStatus.includes("success")) {return "success";}
    if (normalizedStatus.includes("fail") || normalizedStatus.includes("error") || normalizedStatus.includes("reject")) {return "destructive";}
    if (normalizedStatus.includes("pending") || normalizedStatus.includes("created")) {return "info";}
    return "muted";
  };
  const handleDownloadCsv = () => {
    downloadCsv(
      [["#", t("successfulSales.table.transaction"), t("successfulSales.table.description"), t("successfulSales.table.status"), t("successfulSales.table.createdAt"), t("successfulSales.table.amount")], ...transactions.map((transaction, index) => [index + 1, transaction.id, transaction.description, translateStatus(transaction.status), formatPaymentDateTimeUtc(transaction.createdAt, locale), formatCurrency(transaction.amount, transaction.currency, locale)])],
      `refunds-${appliedRange.fromDate}-to-${appliedRange.toDate}.csv`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><button type="button" onClick={() => navigate(ROUTE_PATHS.dashboard)} className="mb-3 inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> {t("successfulSales.back")}</button><h1 className="mb-1 text-3xl font-bold text-foreground">{t("successfulSales.cards.refunds.title")}</h1></div></div>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2"><GmvTotalMetricCard id="refunds-total" etiquetaKey="successfulSales.cards.refunds.title" valor={formatNumber(transactions.length, locale)} ayudaKey="successfulSales.cards.refunds.helper" variante="invertida" /><GmvTotalMetricCard id="refunds-amount" etiquetaKey="successfulSales.cards.refundAmount.title" valor={formatCurrency(totalAmount, currency, locale)} ayudaKey="successfulSales.cards.refundAmount.helper" variante="suave" /></section>
      <section className={claseTarjeta("base", "p-4")}><div className="grid items-end gap-4 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(12rem,0.5fr))_auto]"><div className="flex flex-col gap-2"><span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"><CalendarDays className="h-4 w-4" /> {t("successfulSales.filters.period")}</span><div role="group" aria-label={t("successfulSales.filters.period")} className="inline-flex h-10 w-fit flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">{periodModes.map((mode) => { const periodDate = clampPaymentFilterInputDate(mode === "today" ? todayInputDate : addDaysToInputDate(todayInputDate, -1)); const isSelected = appliedRange.fromDate === periodDate && appliedRange.toDate === periodDate && draftFromDate === periodDate && draftToDate === periodDate; return (<button key={mode} type="button" onClick={() => handlePeriodModeChange(mode)} aria-pressed={isSelected} className={isSelected ? "h-8 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition" : "h-8 rounded-md px-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"}>{t(`successfulSales.periodModes.${mode}`)}</button>); })}</div></div><label className="flex flex-col gap-2 text-sm font-medium text-foreground"><span className="text-muted-foreground">{t("common.actions.from")}</span><input value={draftFromDate} min={MIN_PAYMENT_FILTER_INPUT_DATE} onChange={(event) => setDraftFromDate(clampPaymentFilterInputDate(event.target.value))} onKeyDown={handleDateKeyDown} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onPointerDown={handleDatePointerDown} type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/30" /></label><label className="flex flex-col gap-2 text-sm font-medium text-foreground"><span className="text-muted-foreground">{t("common.actions.to")}</span><input value={draftToDate} min={MIN_PAYMENT_FILTER_INPUT_DATE} onChange={(event) => setDraftToDate(clampPaymentFilterInputDate(event.target.value))} onKeyDown={handleDateKeyDown} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onPointerDown={handleDatePointerDown} type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/30" /></label><div className="flex h-10 items-center justify-center"><button type="button" onClick={handleApplyDateFilter} aria-label={t("successfulSales.filters.applyDates")} title={t("successfulSales.filters.applyDates")} disabled={isFetchingTransactions} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"><Check className="h-4 w-4" /></button></div></div>{hasInvalidDateRange ? (<p className="mt-3 text-sm font-medium text-destructive">{t("successfulSales.filters.invalidDateRange")}</p>) : null}</section>
      {isErrorTransactions ? (<div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3"><p className="text-sm text-destructive">{errorMessage}</p></div>) : null}
      <RefundsTable transactions={transactions as Refund[]} isLoading={isLoadingTransactions} emptyStateLabel={emptyStateLabel} locale={locale} formatDateTime={formatPaymentDateTimeUtc} formatCurrency={formatCurrency} translateStatus={translateStatus} translateDescription={translateDescription} getStatusTone={getTransactionStatusTone} tableAction={<button type="button" onClick={handleDownloadCsv} disabled={isLoadingTransactions} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"><Download className="h-3.5 w-3.5" />{t("common.actions.downloadCsv")}</button>} />
      {refundsResult.data?.hasMore && refundsResult.data.nextCursor ? (<div className="flex justify-center"><button type="button" onClick={handleLoadMore} disabled={refundsResult.isFetching} className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60">{t("common.actions.loadMore")}</button></div>) : null}
    </div>
  );
};

export default RefundsView;
