import { ArrowLeft, CalendarDays, Check, Download } from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/config/routePaths";
import { GmvTotalMetricCard } from "@/components/ui/GmvTotalMetricCard";
import { normalizeMinorUnitsToUsd } from "@/shared/utils/currencyNormalization";
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
import { RejectedTable } from "../components/RejectedTable";
import { useRejected } from "../hooks/useRejected";
import { GMV_ERRORS_SIZE, type GmvError, type GmvErrorsQuery } from "../types/gmvError";

type PeriodMode = "today" | "yesterday";
type PeriodRange = { fromDate: string; toDate: string };
const periodModes: PeriodMode[] = ["today", "yesterday"];
const normalizeAmountToUsdMinorUnits = (amount: number | null, currency: string): number | null => {
  if (amount === null) {return null;}
  const sourceCurrency = currency.trim().toUpperCase() || "USD";
  return sourceCurrency === "USD" ? amount : normalizeMinorUnitsToUsd(amount, sourceCurrency);
};
const formatUsdMinorUnits = (minorUnits: number | null, locale: string): string => {
  if (minorUnits === null) {return "-";}
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(minorUnits / 100);
};
const formatNumber = (value: number, locale: string): string => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
const formatFallbackStatus = (status: string): string => status.toLowerCase().split(/[\s_ -]+/).filter(Boolean).map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" ");
const getStatusTone = (status: string): "info" | "success" | "destructive" | "muted" | "warning" => {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus.includes("error") || normalizedStatus.includes("fail") || normalizedStatus.includes("reject") || normalizedStatus.includes("declin")) {return "destructive";}
  if (normalizedStatus.includes("success") || normalizedStatus.includes("succeeded") || normalizedStatus.includes("approved")) {return "success";}
  if (normalizedStatus.includes("created") || normalizedStatus.includes("pending")) {return "info";}
  return "muted";
};

const RejectedView = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.resolvedLanguage === "es" ? "es-MX" : "en-US";
  const todayInputDate = getTodayInputDate();
  const initialFromDate = todayInputDate;
  const [draftFromDate, setDraftFromDate] = useState(initialFromDate);
  const [draftToDate, setDraftToDate] = useState(todayInputDate);
  const [appliedRange, setAppliedRange] = useState<PeriodRange>({ fromDate: initialFromDate, toDate: todayInputDate });
  const [cursor, setCursor] = useState<string | null>(null);
  const [accumulatedRecords, setAccumulatedRecords] = useState<GmvError[]>([]);
  const [invalidRangeApplied, setInvalidRangeApplied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const hasInvalidDateRange = draftFromDate > draftToDate;
  const hasAppliedInvalidDateRange = appliedRange.fromDate > appliedRange.toDate;
  const invalidDateLabel = locale === "es-MX" ? "no hay datos" : "no data";
  const query = useMemo<GmvErrorsQuery>(() => ({ from: toStartOfUtcDayIso(appliedRange.fromDate), to: toExclusiveEndOfUtcDayIso(appliedRange.toDate), size: GMV_ERRORS_SIZE, cursor, refreshKey }), [appliedRange, cursor, refreshKey]);
  const errorsResult = useRejected(query, !hasAppliedInvalidDateRange);
  const pageRecords = useMemo(() => errorsResult.data?.data ?? [], [errorsResult.data?.data]);
  const records = useMemo(() => invalidRangeApplied ? [] : accumulatedRecords, [accumulatedRecords, invalidRangeApplied]);
  const total = invalidRangeApplied ? 0 : errorsResult.data?.total ?? records.length;
  const totalAmount = useMemo(() => records.reduce((sum, record) => sum + (normalizeAmountToUsdMinorUnits(record.amount, record.currency) ?? 0), 0), [records]);
  const errorMessage = errorsResult.error instanceof Error ? errorsResult.error.message : t("dashboard.gmvDetail.errorResponses.error");
  const emptyStateLabel = invalidRangeApplied ? invalidDateLabel : t("dashboard.gmvDetail.errorResponses.empty");
  const isLoadingRecords = errorsResult.isLoading;
  const isFetchingRecords = errorsResult.isFetching;
  const isErrorRecords = errorsResult.isError;

  useEffect(() => { setCursor(null); setAccumulatedRecords([]); }, [appliedRange.fromDate, appliedRange.toDate]);
  useEffect(() => {
    if (!errorsResult.data) {return;}
    setAccumulatedRecords((currentRecords) => {
      if (!cursor) {return pageRecords;}
      const existingIds = new Set(currentRecords.map((record) => record.id));
      const nextRecords = pageRecords.filter((record) => !existingIds.has(record.id));
      return [...currentRecords, ...nextRecords];
    });
  }, [cursor, errorsResult.data, pageRecords]);

  const handleDateKeyDown = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key !== "Tab") {event.preventDefault();} };
  const handleDatePointerDown = (event: PointerEvent<HTMLInputElement>) => { const input = event.currentTarget; if ("showPicker" in input) {input.showPicker();} };
  const handleApplyDateFilter = () => {
    const nextFromDate = clampPaymentFilterInputDate(draftFromDate);
    const nextToDate = clampPaymentFilterInputDate(draftToDate);
    if (nextFromDate > nextToDate) { setInvalidRangeApplied(true); setCursor(null); setAccumulatedRecords([]); return; }
    setInvalidRangeApplied(false); setCursor(null); setAccumulatedRecords([]); setDraftFromDate(nextFromDate); setDraftToDate(nextToDate); setAppliedRange({ fromDate: nextFromDate, toDate: nextToDate }); setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  };
  const handlePeriodModeChange = (periodMode: PeriodMode) => {
    const nextDate = clampPaymentFilterInputDate(periodMode === "today" ? todayInputDate : addDaysToInputDate(todayInputDate, -1));
    setInvalidRangeApplied(false); setDraftFromDate(nextDate); setDraftToDate(nextDate); setAppliedRange({ fromDate: nextDate, toDate: nextDate }); setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  };
  const handleLoadMore = () => { if (errorsResult.data?.nextCursor) {setCursor(errorsResult.data.nextCursor);} };
  const translateStatus = (status: string): string => status.trim().toUpperCase().includes("ERROR") ? t("dashboard.gmvDetail.statusValues.error") : t("dashboard.gmvDetail.statusValues.unknown", { status: formatFallbackStatus(status) });
  const handleDownloadCsv = () => {
    downloadCsv(
      [["#", t("dashboard.gmvDetail.table.error"), t("dashboard.gmvDetail.table.detail"), t("dashboard.gmvDetail.table.customer"), t("dashboard.gmvDetail.table.merchant"), t("dashboard.gmvDetail.table.status"), t("dashboard.gmvDetail.table.createdAt"), t("dashboard.gmvDetail.table.amount")], ...records.map((record, index) => [index + 1, record.id, record.detail ?? record.reference, record.customer, record.merchant, translateStatus(record.status), formatPaymentDateTimeUtc(record.createdAt, locale), formatUsdMinorUnits(normalizeAmountToUsdMinorUnits(record.amount, record.currency), locale)])],
      `rejected-transactions-${appliedRange.fromDate}-to-${appliedRange.toDate}.csv`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><button type="button" onClick={() => navigate(ROUTE_PATHS.dashboard)} className="mb-3 inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> {t("dashboard.gmvDetail.back")}</button><h1 className="mb-1 text-3xl font-bold text-foreground">{t("dashboard.gmvDetail.cards.errors.title")}</h1></div></div>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2"><GmvTotalMetricCard id="gmv-errors-total" etiquetaKey="dashboard.gmvDetail.cards.errors.title" valor={formatNumber(total, locale)} ayudaKey="dashboard.gmvDetail.cards.errors.helper" variante="invertida" /><GmvTotalMetricCard id="gmv-errors-amount" etiquetaKey="dashboard.gmvDetail.cards.errorAmount.title" valor={formatUsdMinorUnits(totalAmount, locale)} ayudaKey="dashboard.gmvDetail.cards.errorAmount.helper" variante="suave" valueClassName="text-destructive" /></section>
      <section className={claseTarjeta("base", "p-4")}><div className="grid items-end gap-4 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(12rem,0.5fr))_auto]"><div className="flex flex-col gap-2"><span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"><CalendarDays className="h-4 w-4" /> {t("dashboard.gmvDetail.filters.period")}</span><div role="group" aria-label={t("dashboard.gmvDetail.filters.period")} className="inline-flex h-10 w-fit flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">{periodModes.map((mode) => { const periodDate = clampPaymentFilterInputDate(mode === "today" ? todayInputDate : addDaysToInputDate(todayInputDate, -1)); const isSelected = appliedRange.fromDate === periodDate && appliedRange.toDate === periodDate && draftFromDate === periodDate && draftToDate === periodDate; return (<button key={mode} type="button" onClick={() => handlePeriodModeChange(mode)} aria-pressed={isSelected} className={isSelected ? "h-8 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition" : "h-8 rounded-md px-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"}>{t(`dashboard.gmvDetail.periodModes.${mode}`)}</button>); })}</div></div><label className="flex flex-col gap-2 text-sm font-medium text-foreground"><span className="text-muted-foreground">{t("common.actions.from")}</span><input value={draftFromDate} min={MIN_PAYMENT_FILTER_INPUT_DATE} onChange={(event) => setDraftFromDate(clampPaymentFilterInputDate(event.target.value))} onKeyDown={handleDateKeyDown} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onPointerDown={handleDatePointerDown} type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/30" /></label><label className="flex flex-col gap-2 text-sm font-medium text-foreground"><span className="text-muted-foreground">{t("common.actions.to")}</span><input value={draftToDate} min={MIN_PAYMENT_FILTER_INPUT_DATE} onChange={(event) => setDraftToDate(clampPaymentFilterInputDate(event.target.value))} onKeyDown={handleDateKeyDown} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onPointerDown={handleDatePointerDown} type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/30" /></label><div className="flex h-10 items-center justify-center"><button type="button" onClick={handleApplyDateFilter} aria-label={t("successfulSales.filters.applyDates")} title={t("successfulSales.filters.applyDates")} disabled={isFetchingRecords} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"><Check className="h-4 w-4" /></button></div></div>{hasInvalidDateRange ? (<p className="mt-3 text-sm font-medium text-destructive">{t("successfulSales.filters.invalidDateRange")}</p>) : null}</section>
      {isErrorRecords ? (<div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3"><p className="text-sm text-destructive">{errorMessage}</p></div>) : null}
      <RejectedTable records={records as GmvError[]} isLoading={isLoadingRecords} emptyStateLabel={emptyStateLabel} locale={locale} formatDateTime={formatPaymentDateTimeUtc} formatAmount={(record, currentLocale) => formatUsdMinorUnits(normalizeAmountToUsdMinorUnits(record.amount, record.currency), currentLocale)} translateStatus={translateStatus} getStatusTone={getStatusTone} tableAction={<button type="button" onClick={handleDownloadCsv} disabled={isLoadingRecords} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"><Download className="h-3.5 w-3.5" />{t("common.actions.downloadCsv")}</button>} />
      {errorsResult.data?.hasMore && errorsResult.data.nextCursor ? (<div className="flex justify-center"><button type="button" onClick={handleLoadMore} disabled={errorsResult.isFetching} className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60">{t("common.actions.loadMore")}</button></div>) : null}
    </div>
  );
};

export default RejectedView;
