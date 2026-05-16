import { ArrowLeft, CalendarDays, Check, Download } from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/config/routePaths";
import { GmvTotalMetricCard } from "@/components/ui/GmvTotalMetricCard";
import type { Metrica } from "@/features/dashboard/data";
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
import { claseTarjeta } from "@/shared/ui/estilosDashboard";
import { IntentsTable } from "../components/IntentsTable";
import { useIntents } from "../hooks/useIntents";
import {
  PAYMENT_INTENTS_INITIAL_SIZE,
  PAYMENT_INTENTS_LOAD_MORE_SIZE,
  PAYMENT_INTENTS_STATUS,
  type PaymentIntent,
  type PaymentIntentsQuery,
} from "../types/paymentIntent";

type PeriodMode = "today" | "yesterday";
type PeriodRange = { fromDate: string; toDate: string };
type IntentMetric = Metrica & { valueClassName?: string };

const periodModes: PeriodMode[] = ["today", "yesterday"];
const SUCCEEDED_STATUS = "SUCCEEDED";
const INTENTS_FILTER_STATUSES = [PAYMENT_INTENTS_STATUS, SUCCEEDED_STATUS] as const;
type StatusFilterOption = (typeof INTENTS_FILTER_STATUSES)[number];

const formatUsdMinorUnits = (minorUnits: number | null, locale: string): string => {
  if (minorUnits === null) {return "-";}
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(minorUnits / 100);
};
const formatNumber = (value: number, locale: string): string => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
const formatFallbackStatus = (status: string): string =>
  status
    .toLowerCase()
    .split(/[\s_ -]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
const getStatusTone = (status: string): "info" | "success" | "destructive" | "muted" | "warning" => {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus.includes("error") || normalizedStatus.includes("fail") || normalizedStatus.includes("reject")) {return "destructive";}
  if (normalizedStatus.includes("success") || normalizedStatus.includes("succeeded") || normalizedStatus.includes("approved")) {return "success";}
  if (normalizedStatus.includes("created") || normalizedStatus.includes("pending")) {return "info";}
  return "muted";
};

const IntentsView = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.resolvedLanguage === "es" ? "es-MX" : "en-US";
  const todayInputDate = getTodayInputDate();
  const [draftFromDate, setDraftFromDate] = useState(todayInputDate);
  const [draftToDate, setDraftToDate] = useState(todayInputDate);
  const [appliedRange, setAppliedRange] = useState<PeriodRange>({ fromDate: todayInputDate, toDate: todayInputDate });
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterOption>(PAYMENT_INTENTS_STATUS);
  const [cursor, setCursor] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [accumulatedRecords, setAccumulatedRecords] = useState<PaymentIntent[]>([]);
  const [invalidRangeApplied, setInvalidRangeApplied] = useState(false);
  const hasInvalidDateRange = draftFromDate > draftToDate;
  const hasAppliedInvalidDateRange = appliedRange.fromDate > appliedRange.toDate;
  const invalidDateLabel = locale === "es-MX" ? "no hay datos" : "no data";

  const intentsQuery = useMemo<PaymentIntentsQuery>(
    () => ({
      from: toStartOfUtcDayIso(appliedRange.fromDate),
      to: toExclusiveEndOfUtcDayIso(appliedRange.toDate),
      status: selectedStatus,
      size: cursor ? PAYMENT_INTENTS_LOAD_MORE_SIZE : PAYMENT_INTENTS_INITIAL_SIZE,
      cursor,
      refreshKey,
    }),
    [appliedRange, cursor, refreshKey, selectedStatus],
  );

  const intentsResult = useIntents(intentsQuery, !hasAppliedInvalidDateRange);
  const pageRecords = useMemo(() => {
    const selectedStatusNormalized = selectedStatus.toUpperCase();
    return (intentsResult.data?.data ?? []).filter((record) => record.status.trim().toUpperCase() === selectedStatusNormalized);
  }, [intentsResult.data?.data, selectedStatus]);
  const records = useMemo(() => invalidRangeApplied ? [] : accumulatedRecords, [accumulatedRecords, invalidRangeApplied]);
  const total = records.length;
  const totalAmount = useMemo(() => records.reduce((sum, record) => sum + (record.amountMinorUnits ?? 0), 0), [records]);
  const errorMessage = intentsResult.error instanceof Error ? intentsResult.error.message : t("dashboard.gmvDetail.error");
  const emptyStateLabel = invalidRangeApplied ? invalidDateLabel : t("dashboard.gmvDetail.empty");
  const isLoadingRecords = intentsResult.isLoading;
  const isFetchingRecords = intentsResult.isFetching;
  const isErrorRecords = intentsResult.isError;

  useEffect(() => {
    setCursor(null);
    setAccumulatedRecords([]);
  }, [appliedRange.fromDate, appliedRange.toDate, refreshKey, selectedStatus]);

  useEffect(() => {
    if (!intentsResult.data) {return;}
    setAccumulatedRecords((currentRecords) => {
      if (!cursor) {return pageRecords;}
      const existingIds = new Set(currentRecords.map((record) => record.id));
      const nextRecords = pageRecords.filter((record) => !existingIds.has(record.id));
      return [...currentRecords, ...nextRecords];
    });
  }, [cursor, intentsResult.data, pageRecords]);

  const metricas: IntentMetric[] = [
    { id: "payment-intents-total", etiquetaKey: "dashboard.gmvDetail.cards.total.title", valor: formatNumber(total, locale), ayudaKey: "dashboard.gmvDetail.cards.total.helper", variante: "invertida" },
    { id: "payment-intents-amount", etiquetaKey: "dashboard.gmvDetail.cards.amount.title", valor: formatUsdMinorUnits(totalAmount, locale), ayudaKey: "dashboard.gmvDetail.cards.amount.helper", variante: "suave", valueClassName: "text-destructive" },
  ];

  const handleDateKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Tab") {event.preventDefault();}
  };
  const handleDatePointerDown = (event: PointerEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    if ("showPicker" in input) {input.showPicker();}
  };
  const handleApplyDateFilter = () => {
    const nextFromDate = clampPaymentFilterInputDate(draftFromDate);
    const nextToDate = clampPaymentFilterInputDate(draftToDate);

    if (nextFromDate > nextToDate) {
      setInvalidRangeApplied(true);
      setCursor(null);
      setAccumulatedRecords([]);
      return;
    }

    setInvalidRangeApplied(false);
    setCursor(null);
    setAccumulatedRecords([]);
    setDraftFromDate(nextFromDate);
    setDraftToDate(nextToDate);
    setAppliedRange({ fromDate: nextFromDate, toDate: nextToDate });
    setRefreshKey((currentRefreshKey) => currentRefreshKey + 1);
  };
  const handlePeriodModeChange = (periodMode: PeriodMode) => {
    const nextDate = clampPaymentFilterInputDate(periodMode === "today" ? todayInputDate : addDaysToInputDate(todayInputDate, -1));
    setInvalidRangeApplied(false);
    setDraftFromDate(nextDate);
    setDraftToDate(nextDate);
    setAppliedRange({ fromDate: nextDate, toDate: nextDate });
  };
  const translateStatus = (status: string): string => {
    const normalizedStatus = status.trim().toUpperCase();
    if (normalizedStatus === PAYMENT_INTENTS_STATUS) {return t("dashboard.gmvDetail.statusValues.linkCreated");}
    if (normalizedStatus === SUCCEEDED_STATUS) {return t("dashboard.gmvDetail.statusValues.succeeded");}
    return t("dashboard.gmvDetail.statusValues.unknown", { status: formatFallbackStatus(status) });
  };
  const handleLoadMore = () => {
    if (intentsResult.data?.nextCursor) {setCursor(intentsResult.data.nextCursor);}
  };
  const handleDownloadCsv = () => {
    downloadCsv(
      [
        [
          "#",
          t("dashboard.gmvDetail.table.id"),
          t("dashboard.gmvDetail.table.orderId"),
          t("dashboard.gmvDetail.table.transactionId"),
          t("dashboard.gmvDetail.table.merchantId"),
          t("dashboard.gmvDetail.table.status"),
          t("dashboard.gmvDetail.table.createdAt"),
          t("dashboard.gmvDetail.table.amount"),
        ],
        ...records.map((record, index) => [
          index + 1,
          record.id,
          record.orderId,
          record.transactionId,
          record.merchantId,
          translateStatus(record.status),
          formatPaymentDateTimeUtc(record.createdAt, locale),
          formatUsdMinorUnits(record.amountMinorUnits, locale),
        ]),
      ],
      `payment-intents-${appliedRange.fromDate}-to-${appliedRange.toDate}.csv`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button type="button" onClick={() => navigate(ROUTE_PATHS.dashboard)} className="mb-3 inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("dashboard.gmvDetail.back")}
          </button>
          <h1 className="mb-1 text-3xl font-bold text-foreground">{t("dashboard.gmvDetail.title")}</h1>
        </div>
      </div>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">{metricas.map((metrica) => (<GmvTotalMetricCard key={metrica.id} {...metrica} />))}</section>
      <section className={claseTarjeta("base", "p-4")}>
        <div className="grid items-end gap-4 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(12rem,0.5fr))_auto]">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"><CalendarDays className="h-4 w-4" /> {t("dashboard.gmvDetail.filters.period")}</span>
            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label={t("dashboard.gmvDetail.filters.period")} className="inline-flex h-10 w-fit flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
                {periodModes.map((mode) => {
                  const periodDate = mode === "today" ? todayInputDate : addDaysToInputDate(todayInputDate, -1);
                  const isSelected = appliedRange.fromDate === periodDate && appliedRange.toDate === periodDate && draftFromDate === periodDate && draftToDate === periodDate;
                  return (
                    <button key={mode} type="button" onClick={() => handlePeriodModeChange(mode)} aria-pressed={isSelected} className={isSelected ? "h-8 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition" : "h-8 rounded-md px-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"}>
                      {t(`dashboard.gmvDetail.periodModes.${mode}`)}
                    </button>
                  );
                })}
              </div>
              <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as StatusFilterOption)} aria-label={t("dashboard.gmvDetail.filters.status")} className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:ring-2 focus:ring-ring/30">
                {INTENTS_FILTER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {translateStatus(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground"><span className="text-muted-foreground">{t("common.actions.from")}</span><input value={draftFromDate} min={MIN_PAYMENT_FILTER_INPUT_DATE} onChange={(event) => setDraftFromDate(clampPaymentFilterInputDate(event.target.value))} onKeyDown={handleDateKeyDown} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onPointerDown={handleDatePointerDown} type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/30" /></label>
          <label className="flex flex-col gap-2 text-sm font-medium text-foreground"><span className="text-muted-foreground">{t("common.actions.to")}</span><input value={draftToDate} min={MIN_PAYMENT_FILTER_INPUT_DATE} onChange={(event) => setDraftToDate(clampPaymentFilterInputDate(event.target.value))} onKeyDown={handleDateKeyDown} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()} onPointerDown={handleDatePointerDown} type="date" className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring/30" /></label>
          <div className="flex h-10 items-center justify-center"><button type="button" onClick={handleApplyDateFilter} aria-label={t("dashboard.gmvDetail.filters.applyDates")} title={t("dashboard.gmvDetail.filters.applyDates")} disabled={isFetchingRecords} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"><Check className="h-4 w-4" /></button></div>
        </div>
        {hasInvalidDateRange ? (<p className="mt-3 text-sm font-medium text-destructive">{t("dashboard.gmvDetail.filters.invalidDateRange")}</p>) : null}
      </section>
      {isErrorRecords ? (<div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3"><p className="text-sm text-destructive">{errorMessage}</p></div>) : null}
      <IntentsTable records={records} isLoading={isLoadingRecords} emptyStateLabel={emptyStateLabel} locale={locale} formatDateTime={formatPaymentDateTimeUtc} formatAmount={(record, currentLocale) => formatUsdMinorUnits(record.amountMinorUnits, currentLocale)} translateStatus={translateStatus} getStatusTone={getStatusTone} tableAction={<button type="button" onClick={handleDownloadCsv} disabled={isLoadingRecords} className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"><Download className="h-3.5 w-3.5" />{t("common.actions.downloadCsv")}</button>} />
      {intentsResult.data?.hasMore && intentsResult.data.nextCursor ? (<div className="flex justify-center"><button type="button" onClick={handleLoadMore} disabled={intentsResult.isFetching} className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60">{t("common.actions.loadMore")}</button></div>) : null}
    </div>
  );
};

export default IntentsView;
