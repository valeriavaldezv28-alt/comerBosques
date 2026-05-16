import { Activity, BarChart3, Clock3, Globe2, Info, MapPin, PieChart, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { claseTarjeta } from "@/shared/ui/estilosDashboard";
import type {
  DashboardHourlyPerformance,
  DashboardPulsePoint,
  DashboardStatusDistributionPoint,
} from "../types/dashboardCharts";

type DashboardPulseChartProps = {
  data: DashboardPulsePoint[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  locale: string;
};

type DashboardHourlyPerformanceChartProps = {
  data: DashboardHourlyPerformance[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  locale: string;
};

type DashboardStatusDistributionChartProps = {
  data: DashboardStatusDistributionPoint[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  locale: string;
};

const CHART_WIDTH = 760;
const CHART_HEIGHT = 300;
const CHART_MARGIN = {
  top: 40,
  right: 32,
  bottom: 46,
  left: 56,
};

const PLOT_WIDTH = CHART_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right;
const PLOT_HEIGHT = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;
const PLOT_BOTTOM = CHART_MARGIN.top + PLOT_HEIGHT;

const PULSE_CHART_WIDTH = 760;
const PULSE_CHART_HEIGHT = 260;
const PULSE_CHART_MARGIN = {
  top: 34,
  right: 118,
  bottom: 40,
  left: 100,
};
const PULSE_PLOT_WIDTH =
  PULSE_CHART_WIDTH - PULSE_CHART_MARGIN.left - PULSE_CHART_MARGIN.right;
const PULSE_PLOT_HEIGHT =
  PULSE_CHART_HEIGHT - PULSE_CHART_MARGIN.top - PULSE_CHART_MARGIN.bottom;
const PULSE_PLOT_BOTTOM = PULSE_CHART_MARGIN.top + PULSE_PLOT_HEIGHT;

const DISTRIBUTION_COLORS = [
  "hsl(var(--success))",
  "hsl(42 94% 55%)",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];
const DISTRIBUTION_ALLOWED_STATUSES = new Set([
  "SUCCEEDED",
  "LINK_CREATED",
]);
const PULSE_VOLUME_COLOR = "hsl(42 84% 48%)";
const PULSE_VOLUME_COLOR_SOFT = "hsl(42 84% 60%)";

const getNiceMax = (value: number): number => {
  if (value <= 0) {
    return 1;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil((value * 1.15) / magnitude) * magnitude;
};
const getCurrencyAxisMax = (value: number): number => {
  if (value <= 0) {
    return 1;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 5
          ? 5
          : 10;

  return niceNormalized * magnitude;
};
const formatHour = (hour: number): string =>
  `${String(hour).padStart(2, "0")}:00`;

const ChartMessage = ({ children }: { children: string }) => (
  <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
    {children}
  </div>
);

const ChartSkeleton = () => (
  <div className="min-h-64 animate-pulse rounded-lg border border-border bg-muted/20 p-4">
    <div className="flex h-56 items-end gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`chart-skeleton-${index}`}
          className="flex-1 rounded-t-lg bg-muted"
          style={{ height: `${34 + index * 9}%` }}
        />
      ))}
    </div>
  </div>
);

const getPointX = (index: number, totalItems: number): number => {
  if (totalItems <= 1) {
    return CHART_MARGIN.left + PLOT_WIDTH / 2;
  }

  return CHART_MARGIN.left + (index * PLOT_WIDTH) / (totalItems - 1);
};

const getPulsePointX = (
  index: number,
  totalItems: number,
  plotWidth = PULSE_PLOT_WIDTH,
): number => {
  const edgePadding = totalItems <= 3
    ? plotWidth * 0.16
    : Math.min(96, plotWidth * 0.1);
  const usableWidth = plotWidth - edgePadding * 2;

  if (totalItems <= 1) {
    return edgePadding + usableWidth / 2;
  }

  return edgePadding + (index * usableWidth) / (totalItems - 1);
};

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const describeSlice = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string => {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
};

const formatBrowserTimeZoneLabel = (timeZone: string) => {
  const cityName = timeZone.split("/").pop()?.replace(/_/g, " ");

  return cityName ?? timeZone;
};

const formatTimeZoneOffset = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const valueByType = new Map(parts.map((part) => [part.type, part.value]));
  const zonedAsUtc = Date.UTC(
    Number(valueByType.get("year")),
    Number(valueByType.get("month")) - 1,
    Number(valueByType.get("day")),
    Number(valueByType.get("hour")),
    Number(valueByType.get("minute")),
    Number(valueByType.get("second")),
  );
  const offsetHours = Math.round((zonedAsUtc - date.getTime()) / 3_600_000);

  return offsetHours === 0
    ? "UTC+0"
    : `UTC${offsetHours > 0 ? "+" : ""}${offsetHours}`;
};

export const DashboardUtcReferenceCard = ({ locale }: { locale: string }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const browserTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: browserTimeZone,
      }),
    [browserTimeZone, locale],
  );
  const utcDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    [locale],
  );
  const utcTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      }),
    [locale],
  );
  const localTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: browserTimeZone,
      }),
    [browserTimeZone, locale],
  );
  const timeZoneLabel = formatBrowserTimeZoneLabel(browserTimeZone);
  const formatTimeParts = (formatter: Intl.DateTimeFormat) => {
    const timeParts = formatter.formatToParts(currentDate);
    const hourValue = timeParts.find((part) => part.type === "hour")?.value ?? "--";
    const minuteValue = timeParts.find((part) => part.type === "minute")?.value ?? "--";
    const periodValue = timeParts
      .find((part) => part.type === "dayPeriod")
      ?.value
      .replace(/\s/g, "")
      .toUpperCase();

    return {
      periodValue,
      timeValue: `${hourValue}:${minuteValue}`,
    };
  };
  const utcTime = formatTimeParts(utcTimeFormatter);
  const localTime = formatTimeParts(localTimeFormatter);
  const localOffset = formatTimeZoneOffset(currentDate, browserTimeZone);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className={claseTarjeta("base", "flex h-full flex-col justify-center p-4 sm:p-5")}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info/10 text-info">
            <Clock3 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground">
              {t("dashboard.charts.utcReference.title")}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("dashboard.charts.utcReference.helper")}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
          <span className="h-2 w-2 rounded-full bg-success" />
          {t("dashboard.charts.utcReference.live")}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-info/20 bg-info/5 px-4 py-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-info">
            <Globe2 className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold text-info">
            {t("dashboard.charts.utcReference.utcTime")}
          </p>
          <span className="mt-1 inline-flex items-baseline justify-center gap-2">
            <span className="text-3xl font-extrabold tracking-normal text-foreground">
              {utcTime.timeValue}
            </span>
            {utcTime.periodValue ? (
              <span className="text-lg font-bold text-info">
                {utcTime.periodValue}
              </span>
            ) : null}
          </span>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            UTC+0
          </p>
        </div>

        <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold text-success">
            {t("dashboard.charts.utcReference.localTime")}
          </p>
          <span className="mt-1 inline-flex items-baseline justify-center gap-2">
            <span className="text-3xl font-extrabold tracking-normal text-foreground">
              {localTime.timeValue}
            </span>
            {localTime.periodValue ? (
              <span className="text-lg font-bold text-success">
                {localTime.periodValue}
              </span>
            ) : null}
          </span>
          <p className="mt-2 truncate text-xs font-semibold text-muted-foreground">
            {timeZoneLabel} · {localOffset}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
        <div className="grid gap-3 text-center sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-info">
              {t("dashboard.charts.utcReference.utcDate")}
            </p>
            <p className="mt-0.5 text-sm font-bold capitalize text-foreground">
              {utcDateFormatter.format(currentDate)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-success">
              {t("dashboard.charts.utcReference.localDate")}
            </p>
            <p className="mt-0.5 text-sm font-bold capitalize text-foreground">
              {dateFormatter.format(currentDate)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-info" />
          {t("dashboard.charts.utcReference.note")}
        </p>
        <p className="flex items-center gap-2 font-medium">
          <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
          {t("dashboard.charts.utcReference.footer")}
        </p>
      </div>
    </section>
  );
};

export const DashboardPulseChart = ({
  data,
  isLoading,
  isError,
  errorMessage,
  locale,
}: DashboardPulseChartProps) => {
  const { t } = useTranslation();
  const points = data;

  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const totalVolume = points.reduce((sum, point) => sum + point.moneyVolume, 0);
  const totalTransactions = points.reduce(
    (sum, point) => sum + point.transactionCount,
    0,
  );
  const volumeAxisMax = getCurrencyAxisMax(
    Math.max(...points.map((point) => point.moneyVolume), 0),
  );
  const transactionAxisMax = getNiceMax(
    Math.max(...points.map((point) => point.transactionCount), 0),
  );
  const gridTicks = [0, 0.25, 0.5, 0.75, 1];
  const compactMoneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 1,
        notation: "compact",
      }),
    [locale],
  );
  const barWidth = Math.min(
    points.length <= 3 ? 92 : 72,
    Math.max(32, PULSE_PLOT_WIDTH / Math.max(points.length * 2.6, 1)),
  );
  const responsiveChartWidth = Math.max(
    1080,
    points.length * 108,
  );
  const highestVolume = Math.max(...points.map((point) => point.moneyVolume), 0);
  const getShortMoneyLabel = (value: number): string =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 1,
      notation: "compact",
    }).format(value);
  const linePoints = points.map((point, index) => {
    const x = getPulsePointX(index, points.length, responsiveChartWidth);
    const y =
      PULSE_PLOT_BOTTOM -
      (point.transactionCount / transactionAxisMax) * PULSE_PLOT_HEIGHT;

    return { ...point, x, y };
  });
  const linePath = linePoints.reduce((path, point, index, currentPoints) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previousPoint = currentPoints[index - 1];
    const controlOffset = (point.x - previousPoint.x) * 0.45;

    return `${path} C ${previousPoint.x + controlOffset} ${previousPoint.y}, ${point.x - controlOffset} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  return (
    <section className={claseTarjeta("base", "p-4 sm:p-5")}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Activity className="h-4 w-4 text-info" />
            {t("dashboard.charts.pulse.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("dashboard.charts.pulse.helper")}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">
            {moneyFormatter.format(totalVolume)}
          </p>
          <p>{t("dashboard.charts.pulse.totalVolume")}</p>
        </div>
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : isError ? (
        <ChartMessage>{errorMessage}</ChartMessage>
      ) : points.length === 0 ? (
        <ChartMessage>{t("dashboard.charts.pulse.empty")}</ChartMessage>
      ) : (
        <>
          <div className="mb-2 grid grid-cols-[4.75rem_minmax(0,1fr)_3.5rem] items-center gap-2 px-1 text-[11px] font-semibold">
            <span style={{ color: PULSE_VOLUME_COLOR }}>
              {t("dashboard.charts.pulse.volumeAxis")}
            </span>
            <span />
            <span className="text-success">
              {t("dashboard.charts.pulse.transactionsAxis")}
            </span>
          </div>
          <div className="grid grid-cols-[4.75rem_minmax(0,1fr)_3.5rem] gap-2">
            <svg
              className="h-[16rem] w-full"
              aria-hidden="true"
              viewBox={`0 0 76 ${PULSE_CHART_HEIGHT}`}
            >
              {gridTicks.map((tick) => {
                const y = PULSE_PLOT_BOTTOM - tick * PULSE_PLOT_HEIGHT;
                const volumeLabel = compactMoneyFormatter.format(volumeAxisMax * tick);

                return (
                  <text
                    key={`volume-axis-${tick}`}
                    x="72"
                    y={y + 4}
                    textAnchor="end"
                    className="fill-muted-foreground text-[11px]"
                  >
                    {volumeLabel}
                  </text>
                );
              })}
            </svg>

            <div className="overflow-x-auto pb-3 [scrollbar-gutter:stable]">
              <svg
                className="h-[16rem] max-w-none"
                style={{ width: `${responsiveChartWidth}px` }}
                role="img"
                aria-label={t("dashboard.charts.pulse.title")}
                viewBox={`0 0 ${responsiveChartWidth} ${PULSE_CHART_HEIGHT}`}
              >
                <defs>
                  <linearGradient
                    id="pulse-bar-gradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={PULSE_VOLUME_COLOR_SOFT}
                      stopOpacity="0.92"
                    />
                    <stop
                      offset="100%"
                      stopColor={PULSE_VOLUME_COLOR}
                      stopOpacity="0.48"
                    />
                  </linearGradient>
                </defs>

                {gridTicks.map((tick) => {
                  const y = PULSE_PLOT_BOTTOM - tick * PULSE_PLOT_HEIGHT;

                  return (
                    <line
                      key={`grid-${tick}`}
                      x1="0"
                      x2={responsiveChartWidth}
                      y1={y}
                      y2={y}
                      stroke="hsl(var(--border) / 0.35)"
                      strokeDasharray={tick === 0 ? "0" : "5 6"}
                    />
                  );
                })}

              {points.map((point, index) => {
                const x = getPulsePointX(index, points.length, responsiveChartWidth);
                const barHeight = Math.max(
                  point.moneyVolume > 0 ? 4 : 0,
                  (point.moneyVolume / volumeAxisMax) * PULSE_PLOT_HEIGHT,
                );
                const barY = PULSE_PLOT_BOTTOM - barHeight;

                return (
                  <g
                    key={`pulse-bar-${point.hour}`}
                    className="transition-all duration-200 hover:opacity-90"
                  >
                    <rect
                      x={x - barWidth / 2}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      rx="7"
                      fill="url(#pulse-bar-gradient)"
                      className="cursor-pointer drop-shadow-sm transition-all duration-200 hover:brightness-110"
                    >
                      <title>
                        {`${formatHour(point.hour)}
${t("dashboard.charts.pulse.tooltip.volume")}: ${moneyFormatter.format(point.moneyVolume)}
${t("dashboard.charts.pulse.tooltip.transactions")}: ${numberFormatter.format(point.transactionCount)}`}
                      </title>
                    </rect>

                    {point.moneyVolume === highestVolume && points.length <= 6 ? (
                      <text
                        x={Math.min(
                          x,
                          responsiveChartWidth - 36,
                        )}
                        y={Math.max(barY - 12, 16)}
                        textAnchor={
                          x > responsiveChartWidth - 48
                            ? "end"
                            : "middle"
                        }
                        stroke="hsl(var(--card))"
                        strokeWidth="4"
                        paintOrder="stroke"
                        className="fill-foreground text-[10px] font-bold"
                      >
                        {getShortMoneyLabel(point.moneyVolume)}
                      </text>
                    ) : null}

                    <text
                      x={x}
                      y={PULSE_PLOT_BOTTOM + 24}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[12px] font-medium"
                    >
                      {formatHour(point.hour)}
                    </text>
                  </g>
                );
              })}

              {linePoints.length > 1 ? (
                <path
                  d={linePath}
                  fill="none"
                  stroke="hsl(var(--success))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.92"
                />
              ) : null}

              {linePoints.map((point) => (
                <g key={`line-point-${point.hour}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill="hsl(var(--success))"
                    stroke="hsl(var(--card))"
                    strokeWidth="2"
                    className="drop-shadow-sm"
                  >
                    <title>
                      {`${formatHour(point.hour)}
${t("dashboard.charts.pulse.tooltip.transactions")}: ${numberFormatter.format(point.transactionCount)}
${t("dashboard.charts.pulse.tooltip.volume")}: ${moneyFormatter.format(point.moneyVolume)}`}
                    </title>
                  </circle>
                </g>
              ))}

              </svg>
            </div>

            <svg
              className="h-[16rem] w-full"
              aria-hidden="true"
              viewBox={`0 0 56 ${PULSE_CHART_HEIGHT}`}
            >
              {gridTicks.map((tick) => {
                const y = PULSE_PLOT_BOTTOM - tick * PULSE_PLOT_HEIGHT;
                const countLabel = numberFormatter.format(transactionAxisMax * tick);

                return (
                  <text
                    key={`transactions-axis-${tick}`}
                    x="4"
                    y={y + 4}
                    className="fill-muted-foreground text-[11px]"
                  >
                    {countLabel}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 mb-4 flex flex-wrap gap-5 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: PULSE_VOLUME_COLOR }} />
              {t("dashboard.charts.pulse.volumeLegend")}
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--success))]" />
              {t("dashboard.charts.pulse.transactionsLegend")}
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-5 items-stretch w-full">
            <div className="dashboard-card-soft px-4 py-2.5">
              <p className="text-xs text-muted-foreground">
                {t("dashboard.charts.pulse.totalVolume")}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {moneyFormatter.format(totalVolume)}
              </p>
            </div>
            <div className="dashboard-card-soft px-4 py-2.5">
              <p className="text-xs text-muted-foreground">
                {t("dashboard.charts.pulse.totalTransactions")}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {numberFormatter.format(totalTransactions)}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export const DashboardHourlyPerformanceChart = ({
  data,
  isLoading,
  isError,
  errorMessage,
  locale,
}: DashboardHourlyPerformanceChartProps) => {
  const { t } = useTranslation();

  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const totalAttempts = data.reduce((sum, item) => sum + item.attempts, 0);
  const totalSuccesses = data.reduce((sum, item) => sum + item.successes, 0);
  const totalSalesVolume = data.reduce(
    (sum, item) => sum + item.salesVolume,
    0,
  );

  const maxValue = getNiceMax(
    Math.max(...data.map((item) => item.successes), 0),
  );

  const gridTicks = [0, 0.25, 0.5, 0.75, 1];

  const createPoints = (
    valueGetter: (item: DashboardHourlyPerformance) => number,
  ) =>
    data.map((item, index) => {
      const x = getPointX(index, data.length);

      const y = PLOT_BOTTOM - (valueGetter(item) / maxValue) * PLOT_HEIGHT;

      return { ...item, x, y };
    });

  const successPoints = createPoints((item) => item.successes);

  const createPath = (points: Array<{ x: number; y: number }>) =>
    points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

  return (
    <section className={claseTarjeta("base", "p-4 sm:p-5")}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <BarChart3 className="h-4 w-4 text-info" />
            {t("dashboard.charts.hourly.title")}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {t("dashboard.charts.hourly.helper")}
          </p>
        </div>

        <div className="text-right text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">
            {moneyFormatter.format(totalSalesVolume)}
          </p>

          <p>{t("dashboard.charts.hourly.totalSalesVolume")}</p>
        </div>
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : isError ? (
        <ChartMessage>{errorMessage}</ChartMessage>
      ) : data.length === 0 ? (
        <ChartMessage>{t("dashboard.charts.hourly.empty")}</ChartMessage>
      ) : (
        <>
          <div className="overflow-x-auto">
            <svg
              className="h-[18rem] w-full"
              role="img"
              aria-label={t("dashboard.charts.hourly.title")}
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            >
              <text
                x={16}
                y={CHART_HEIGHT / 2}
                textAnchor="middle"
                transform={`rotate(-90 22 ${CHART_HEIGHT / 2})`}
                className="fill-success text-[12px] font-semibold"
              >
                Approved transactions
              </text>
              {gridTicks.map((tick) => {
                const y = PLOT_BOTTOM - tick * PLOT_HEIGHT;
                const label = numberFormatter.format(maxValue * tick);

                return (
                  <g key={`hourly-grid-${tick}`}>
                    <line
                      x1={CHART_MARGIN.left}
                      x2={CHART_MARGIN.left + PLOT_WIDTH}
                      y1={y}
                      y2={y}
                      stroke="hsl(var(--border) / 0.35)"
                      strokeDasharray={tick === 0 ? "0" : "5 6"}
                    />

                    <text
                      x={CHART_MARGIN.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-muted-foreground text-[11px]"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              <path
                d={createPath(successPoints)}
                fill="none"
                stroke="hsl(var(--success))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {successPoints.map((point) => (
                <g key={`success-${point.hour}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="6"
                    fill="hsl(var(--success))"
                  />

                  <text
                    x={point.x}
                    y={point.y - 14}
                    textAnchor="middle"
                    className="fill-success text-[11px] font-semibold opacity-80"
                  >
                    {point.successes}
                  </text>
                </g>
              ))}

              {data.map((item, index) => {
                const x = getPointX(index, data.length);

                return (
                  <text
                    key={`hour-label-${item.hour}`}
                    x={x}
                    y={PLOT_BOTTOM + 24}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[12px] font-medium"
                  >
                    {formatHour(item.hour)}
                  </text>
                );
              })}
              <text
                x={CHART_WIDTH / 2}
                y={PLOT_BOTTOM + 42}
                textAnchor="middle"
                className="fill-muted-foreground text-[12px] font-medium"
              >
                Hours of the day
              </text>
            </svg>
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              Successful transactions
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="dashboard-card-soft px-4 py-2.5">
              <p className="text-xs text-muted-foreground">
                {t("dashboard.charts.hourly.totalAttempts")}
              </p>

              <p className="mt-1 text-lg font-semibold text-foreground">
                {numberFormatter.format(totalAttempts)}
              </p>
            </div>

            <div className="dashboard-card-soft px-4 py-2.5">
              <p className="text-xs text-muted-foreground">
                {t("dashboard.charts.hourly.totalSuccesses")}
              </p>

              <p className="mt-1 text-lg font-semibold text-foreground">
                {numberFormatter.format(totalSuccesses)}
              </p>
            </div>

            <div className="dashboard-card-soft px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {t("dashboard.charts.hourly.totalSalesVolume")}
              </p>

              <p className="mt-1 text-lg font-semibold text-foreground">
                {moneyFormatter.format(totalSalesVolume)}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export const DashboardStatusDistributionChart = ({
  data,
  isLoading,
  isError,
  errorMessage,
  locale,
}: DashboardStatusDistributionChartProps) => {
  const { t } = useTranslation();
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const percentageFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [locale],
  );
  const distributionData = useMemo(
    () =>
      data.filter((item) =>
        DISTRIBUTION_ALLOWED_STATUSES.has(item.status.trim().toUpperCase()),
      ),
    [data],
  );
  const formatStatusLabel = (status: string): string => {
    const normalizedStatus = status.trim().toUpperCase();

    if (normalizedStatus === "SUCCEEDED") {
      return t("dashboard.gmvDetail.statusValues.succeeded");
    }

    if (normalizedStatus === "LINK_CREATED") {
      return t("dashboard.gmvDetail.statusValues.linkCreated");
    }

    if (normalizedStatus.includes("ERROR")) {
      return t("dashboard.gmvDetail.statusValues.error");
    }

    return t("dashboard.gmvDetail.statusValues.unknown", {
      status: normalizedStatus.replace(/_/g, " "),
    });
  };
  const total = distributionData.reduce((sum, item) => sum + item.count, 0);
  const slices = distributionData.reduce<
    Array<
      DashboardStatusDistributionPoint & {
        startAngle: number;
        endAngle: number;
        color: string;
        percentage: number;
      }
    >
  >((items, item, index) => {
    const previousItem = items.length > 0 ? items[items.length - 1] : undefined;
    const previousAngle = previousItem?.endAngle ?? 0;
    const percentage = total > 0 ? item.count / total : 0;
    const nextAngle = previousAngle + percentage * 360;

    return [
      ...items,
      {
        ...item,
        startAngle: previousAngle,
        endAngle: nextAngle,
        color: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length],
        percentage,
      },
    ];
  }, []);

  return (
    <section className={claseTarjeta("base", "p-4 sm:p-5")}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <PieChart className="h-4 w-4 text-success" />
            {t("dashboard.charts.statusDistribution.title")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("dashboard.charts.statusDistribution.helper")}
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">
            {numberFormatter.format(total)}
          </p>
          <p>{t("dashboard.charts.statusDistribution.total")}</p>
        </div>
      </div>

      {isLoading ? (
        <ChartSkeleton />
      ) : isError ? (
        <ChartMessage>{errorMessage}</ChartMessage>
      ) : distributionData.length === 0 || total === 0 ? (
        <ChartMessage>
          {t("dashboard.charts.statusDistribution.empty")}
        </ChartMessage>
      ) : (
        <div className="grid items-center gap-5 lg:grid-cols-[minmax(12rem,0.95fr)_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-72">
            <svg
              className="aspect-square w-full"
              role="img"
              aria-label={t("dashboard.charts.statusDistribution.title")}
              viewBox="0 0 220 220"
            >
              {slices.length === 1 ? (
                <circle cx="120" cy="120" r="82" fill={slices[0].color} />
              ) : (
                slices.map((slice) => (
                  <path
                    key={slice.status}
                    d={describeSlice(
                      120,
                      120,
                      96,
                      slice.startAngle,
                      slice.endAngle,
                    )}
                    fill={slice.color}
                    stroke="hsl(var(--card))"
                    strokeWidth="2"
                  />
                ))
              )}
              <circle cx="120" cy="120" r="46" fill="hsl(var(--card))" />
              <text
                x="120"
                y="114"
                textAnchor="middle"
                className="fill-muted-foreground text-[12px] font-medium"
              >
                {t("dashboard.charts.statusDistribution.total")}
              </text>
              <text
                x="120"
                y="137"
                textAnchor="middle"
                className="fill-foreground text-xl font-bold"
              >
                {numberFormatter.format(total)}
              </text>
            </svg>
          </div>

          <div className="space-y-3">
            {slices.map((slice) => (
              <div
                key={slice.status}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
              >
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: slice.color }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {formatStatusLabel(slice.status)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {numberFormatter.format(slice.count)}{" "}
                    {t("dashboard.charts.statusDistribution.items")}
                  </p>
                </div>
                <p className="font-mono text-sm font-semibold text-foreground">
                  {percentageFormatter.format(slice.percentage * 100)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
