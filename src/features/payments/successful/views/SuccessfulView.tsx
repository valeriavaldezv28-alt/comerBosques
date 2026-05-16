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
import {
  getPaymentSearchInputDateRange,
  getPaymentSearchTermType,
  isSuccessfulTransactionStatus,
  isValidPaymentSearchTerm,
} from "@/features/payments/shared/paymentSearch";
import { useTransactionSearch } from "@/features/payments/shared/hooks/useTransactionSearch";
import { useTransactionSearchParam } from "@/features/payments/shared/hooks/useTransactionSearchParam";
import { transactionSearchItemToSale } from "@/features/payments/shared/mappers/transactionSearchMapper";
import {
  SALES_API_SIZE,
  SALES_INITIAL_SIZE,
  SALES_LOAD_MORE_SIZE,
  type Sale,
  type SalesQuery,
  type SuccessfulProcessedTotalQuery,
} from "../types/sale";
import { SuccessfulTable } from "../components/SuccessfulTable";
import {
  formatUnknownSuccessfulPaymentsStatus,
  getSuccessfulPaymentsStatusConfig,
  normalizeSuccessfulPaymentsStatus,
  SUCCESSFUL_PAYMENTS_FILTER_STATUSES,
  SUCCESSFUL_PAYMENTS_PRIMARY_STATUS,
  type SuccessfulPaymentsStatus,
} from "../config/successfulPaymentsStatusConfig";
import {
  useSuccessful,
  useSuccessfulProcessedTotal,
} from "../hooks/useSuccessful";

type PeriodRange = { fromDate: string; toDate: string };
type PeriodMode = "today" | "yesterday";
const periodModes: PeriodMode[] = ["today", "yesterday"];
const TRANSACTION_SEARCH_SIZE = 100;
const formatCurrency = (amount: number | null, currency: string, locale: string): string => {
  if (amount === null) {return "-";}
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
};
const formatNumber = (value: number, locale: string): string => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);

const SuccessfulView = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.resolvedLanguage === "es" ? "es-MX" : "en-US";
  const todayInputDate = getTodayInputDate();
  const initialFromDate = todayInputDate;
  const [draftFromDate, setDraftFromDate] = useState(initialFromDate);
  const [draftToDate, setDraftToDate] = useState(todayInputDate);
  const [appliedRange, setAppliedRange] = useState<PeriodRange>({ fromDate: initialFromDate, toDate: todayInputDate });
  const [visibleCount, setVisibleCount] = useState(SALES_INITIAL_SIZE);
  const [selectedStatus, setSelectedStatus] = useState<SuccessfulPaymentsStatus>(SUCCESSFUL_PAYMENTS_PRIMARY_STATUS);
  const { searchTerm, setSearchTerm } = useTransactionSearchParam();
  const [invalidRangeApplied, setInvalidRangeApplied] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasInvalidDateRange = draftFromDate > draftToDate;
  const hasAppliedInvalidDateRange = appliedRange.fromDate > appliedRange.toDate;
  const trimmedSearchTerm = searchTerm.trim();
  const hasSearchTerm = trimmedSearchTerm.length > 0;
  const searchTermType = getPaymentSearchTermType(trimmedSearchTerm);
  const isSearchTermValid = isValidPaymentSearchTerm(trimmedSearchTerm);
  const canApplySearch = hasSearchTerm && isSearchTermValid;
  const transactionSearchInputRange = useMemo(() => getPaymentSearchInputDateRange(trimmedSearchTerm), [trimmedSearchTerm]);
  const invalidDateLabel = locale === "es-MX" ? "no hay datos" : "no data";
  const salesQuery = useMemo<SalesQuery>(
    () => ({ from: toStartOfUtcDayIso(appliedRange.fromDate), to: toExclusiveEndOfUtcDayIso(appliedRange.toDate), status: selectedStatus, size: SALES_API_SIZE, refreshKey }),
    [appliedRange, refreshKey, selectedStatus],
  );
  const processedTotalQuery = useMemo<SuccessfulProcessedTotalQuery>(
    () => ({
      from: toStartOfUtcDayIso(appliedRange.fromDate),
      to: toExclusiveEndOfUtcDayIso(appliedRange.toDate),
      refreshKey,
    }),
    [appliedRange.fromDate, appliedRange.toDate, refreshKey],
  );
  const transactionSearchQuery = useMemo(
    () => ({
      ...(searchTermType === "transactionId" ? { transactionId: trimmedSearchTerm } : {}),
      ...(searchTermType === "orderId" ? { orderId: trimmedSearchTerm } : {}),
      from: toStartOfUtcDayIso(appliedRange.fromDate),
      to: toExclusiveEndOfUtcDayIso(appliedRange.toDate),
      size: TRANSACTION_SEARCH_SIZE,
    }),
    [appliedRange.fromDate, appliedRange.toDate, searchTermType, trimmedSearchTerm],
  );
  const salesResult = useSuccessful(salesQuery, !hasAppliedInvalidDateRange && !canApplySearch);
  const processedTotalResult = useSuccessfulProcessedTotal(processedTotalQuery, !hasAppliedInvalidDateRange && !canApplySearch);
  const transactionSearchResult = useTransactionSearch(transactionSearchQuery, !hasAppliedInvalidDateRange && canApplySearch);
  const pageTransactions = useMemo(
    () => {
      if (invalidRangeApplied) {
        return [];
      }

      const sourceTransactions = canApplySearch
        ? (transactionSearchResult.data?.items ?? []).map(transactionSearchItemToSale)
        : salesResult.data?.items ?? [];

      return sourceTransactions.filter((transaction) => {
        if (canApplySearch) {
          return isSuccessfulTransactionStatus(transaction.status);
        }

        const matchesStatus = normalizeSuccessfulPaymentsStatus(transaction.status) === selectedStatus;

        return matchesStatus;
      });
    },
    [canApplySearch, invalidRangeApplied, salesResult.data?.items, selectedStatus, transactionSearchResult.data?.items],
  );
  const transactions = useMemo(() => pageTransactions.slice(0, visibleCount), [pageTransactions, visibleCount]);
  const totalAmount = useMemo(() => transactions.reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0), [transactions]);
  const totalRecords = processedTotalResult.data?.totalRecords ?? transactions.length;
  const processedTotalAmount = processedTotalResult.data?.total ?? totalAmount;
  const currency = transactions.find((transaction) => transaction.currency)?.currency ?? "USD";
  const errorMessage = canApplySearch
    ? t("payments.search.error")
    : salesResult.error instanceof Error
      ? salesResult.error.message
      : t("successfulPayments.error");
  const emptyStateLabel = invalidRangeApplied ? invalidDateLabel : canApplySearch ? t("payments.search.empty") : t("successfulPayments.empty");
  const isLoadingTransactions = canApplySearch ? transactionSearchResult.isLoading : salesResult.isLoading;
  const isFetchingTransactions = canApplySearch ? transactionSearchResult.isFetching : salesResult.isFetching;
  const isErrorTransactions = canApplySearch ? transactionSearchResult.isError : salesResult.isError;
  const totalCardTitleKey = "successfulPayments.cards.total.title";
  const totalCardHelperKey = "successfulPayments.cards.total.helper";
  const amountCardTitleKey = "successfulPayments.cards.amount.title";
  const amountCardHelperKey = "successfulPayments.cards.amount.helper";

  useEffect(() => { setVisibleCount(SALES_INITIAL_SIZE); }, [appliedRange.fromDate, appliedRange.toDate, canApplySearch, selectedStatus]);
  useEffect(() => {
    if (!transactionSearchInputRange) {return;}
    const nextRange = {
      fromDate: clampPaymentFilterInputDate(transactionSearchInputRange.fromDate),
      toDate: clampPaymentFilterInputDate(transactionSearchInputRange.toDate),
    };
    setInvalidRangeApplied(false);
    setDraftFromDate(nextRange.fromDate);
    setDraftToDate(nextRange.toDate);
    setAppliedRange((currentRange) => {
      if (
        currentRange.fromDate === nextRange.fromDate
        && currentRange.toDate === nextRange.toDate
      ) {
        return currentRange;
      }

      return nextRange;
    });
  }, [transactionSearchInputRange]);
  useEffect(() => {
    if (!showRefreshSuccess) {return;}
    const timer = window.setTimeout(() => setShowRefreshSuccess(false), 3000);
    return () => window.clearTimeout(timer);
  }, [showRefreshSuccess]);
  const handleDateKeyDown = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key !== "Tab") {event.preventDefault();} };
  const handleDatePointerDown = (event: PointerEvent<HTMLInputElement>) => { const input = event.currentTarget; if ("showPicker" in input) {input.showPicker();} };
  const handleApplyDateFilter = () => {
    const nextFromDate = clampPaymentFilterInputDate(draftFromDate);
    const nextToDate = clampPaymentFilterInputDate(draftToDate);
    if (nextFromDate > nextToDate) { setInvalidRangeApplied(true); setVisibleCount(SALES_INITIAL_SIZE); return; }
    setInvalidRangeApplied(false);
    if (hasSearchTerm) {
      setSearchTerm("");
    }
    setDraftFromDate(nextFromDate);
    setDraftToDate(nextToDate);
    setAppliedRange({ fromDate: nextFromDate, toDate: nextToDate });
    setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
    setShowRefreshSuccess(true);
  };
  const handlePeriodModeChange = (periodMode: PeriodMode) => {
    const nextDate = clampPaymentFilterInputDate(periodMode === "today" ? todayInputDate : addDaysToInputDate(todayInputDate, -1));
    if (hasSearchTerm) {
      setSearchTerm("");
    }
    setInvalidRangeApplied(false); setDraftFromDate(nextDate); setDraftToDate(nextDate); setAppliedRange({ fromDate: nextDate, toDate: nextDate }); setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  };
  const handleLoadMore = () => { setVisibleCount((currentCount) => currentCount + SALES_LOAD_MORE_SIZE); };
  const translateStatus = (status: string): string => {
    const config = getSuccessfulPaymentsStatusConfig(status);
    const normalizedStatus = normalizeSuccessfulPaymentsStatus(status);

    return t(config.labelKey, {
      status: normalizedStatus ?? formatUnknownSuccessfulPaymentsStatus(status),
    });
  };
  const handleDownloadCsv = () => {
    downloadCsv(
      [["#", t("successfulPayments.table.transaction"), t("successfulPayments.table.order"), t("successfulPayments.table.description"), t("successfulPayments.table.card"), t("successfulPayments.table.status"), t("successfulPayments.table.createdAt"), t("successfulPayments.table.amount")], ...transactions.map((transaction, index) => [index + 1, transaction.id, transaction.orderId, transaction.description, `${transaction.cardBrand} ${transaction.lastFourDigits !== "-" ? `**** ${transaction.lastFourDigits}` : transaction.cardNumberMask}`, translateStatus(transaction.status), formatPaymentDateTimeUtc(transaction.createdAt, locale), formatCurrency(transaction.amount, transaction.currency, locale)])],
      `${selectedStatus.toLowerCase()}-payments-${appliedRange.fromDate}-to-${appliedRange.toDate}.csv`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><button type="button" onClick={() => navigate(ROUTE_PATHS.dashboard)} className="mb-3 inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> {t("successfulPayments.back")}</button><h1 className="mb-1 text-3xl font-bold text-foreground">{t("successfulPayments.title")}</h1></div></div>
      {showRefreshSuccess ? (<div className="rounded-lg border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">{t("common.notifications.dataUpdated")}</div>) : null}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2"><GmvTotalMetricCard id="successful-payments-total" etiquetaKey={totalCardTitleKey} valor={formatNumber(totalRecords, locale)} ayudaKey={totalCardHelperKey} variante="invertida" /><GmvTotalMetricCard id="successful-payments-amount" etiquetaKey={amountCardTitleKey} valor={formatCurrency(processedTotalAmount, currency, locale)} ayudaKey={amountCardHelperKey} variante="suave" /></section>
      <section className={claseTarjeta("base", "p-4")}>
        <div className="grid items-end gap-4 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(12rem,0.5fr))_auto]">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="h-4 w-4" /> {t("successfulPayments.filters.period")}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label={t("successfulPayments.filters.period")} className="inline-flex h-10 w-fit flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
                {periodModes.map((mode) => {
                  const periodDate = clampPaymentFilterInputDate(mode === "today" ? todayInputDate : addDaysToInputDate(todayInputDate, -1));
                  const isSelected = appliedRange.fromDate === periodDate && appliedRange.toDate === periodDate && draftFromDate === periodDate && draftToDate === periodDate;
                  return (
                    <button key={mode} type="button" onClick={() => handlePeriodModeChange(mode)} aria-pressed={isSelected} className={isSelected ? "h-8 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition" : "h-8 rounded-md px-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"}>
                      {t(`successfulPayments.periodModes.${mode}`)}
                    </button>
                  );
                })}
              </div>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as SuccessfulPaymentsStatus)} aria-label={t("successfulPayments.filters.status")} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:ring-2 focus:ring-ring/30">
                {SUCCESSFUL_PAYMENTS_FILTER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {translateStatus(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground"><span className="text-muted-foreground">{t("common.actions.from")}</span><input value={draftFromDate} min={MIN_PAYMENT_FILTER_INPUT_DATE} onChange={(event) => setDraftFromDate(clampPaymentFilterInputDate(event.target.value))} onKeyDown={handleDateKeyDown} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onPointerDown={handleDatePointerDown} type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/30" /></label>
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground"><span className="text-muted-foreground">{t("common.actions.to")}</span><input value={draftToDate} min={MIN_PAYMENT_FILTER_INPUT_DATE} onChange={(event) => setDraftToDate(clampPaymentFilterInputDate(event.target.value))} onKeyDown={handleDateKeyDown} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onPointerDown={handleDatePointerDown} type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/30" /></label>
          <div className="flex h-10 items-center justify-center"><button type="button" onClick={handleApplyDateFilter} aria-label={t("successfulPayments.filters.applyDates")} title={t("successfulPayments.filters.applyDates")} disabled={isFetchingTransactions} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"><Check className="h-4 w-4" /></button></div>
        </div>
        {hasInvalidDateRange ? (<p className="mt-3 text-sm font-medium text-destructive">{t("successfulPayments.filters.invalidDateRange")}</p>) : null}
      </section>
      {isErrorTransactions ? (<div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3"><p className="text-sm text-destructive">{errorMessage}</p></div>) : null}
      <SuccessfulTable transactions={transactions as Sale[]} isLoading={isLoadingTransactions} emptyStateLabel={emptyStateLabel} locale={locale} formatDateTime={formatPaymentDateTimeUtc} formatCurrency={formatCurrency} tableAction={<button type="button" onClick={handleDownloadCsv} disabled={isLoadingTransactions} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"><Download className="h-3.5 w-3.5" />{t("common.actions.downloadCsv")}</button>} />
      {!canApplySearch && visibleCount < pageTransactions.length ? (<div className="flex justify-center"><button type="button" onClick={handleLoadMore} disabled={salesResult.isFetching} className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60">{t("common.actions.loadMore")}</button></div>) : null}
    </div>
  );
};

export default SuccessfulView;
