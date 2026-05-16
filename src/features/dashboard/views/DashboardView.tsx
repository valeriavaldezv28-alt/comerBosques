import { useTranslation } from "react-i18next";
import { RefreshCcw } from "lucide-react";

import { TarjetaMetrica } from "@/features/dashboard/components/MetricCard";
import { GmvTotalMetricCard } from "@/components/ui/GmvTotalMetricCard";
import {
  DashboardHourlyPerformanceChart,
  DashboardPulseChart,
  DashboardStatusDistributionChart,
  DashboardUtcReferenceCard,
} from "@/features/dashboard/components/DashboardCharts";

import { useDashboard } from "@/features/dashboard";
import {
  useDashboardHourlyPerformance,
  useDashboardPulse,
  useDashboardStatusDistribution,
} from "@/features/dashboard/hooks/useDashboardCharts";
import { useDashboardKpis } from "@/features/dashboard/hooks/useDashboardKpis";

import {
  obtenerDatosDashboard,
  type LlaveTraduccion,
  type Metrica,
} from "@/features/dashboard/data";
import { ROUTE_PATHS } from "@/config/routePaths";
import { formatPaymentDateTimeUtc, formatPaymentDateUtc } from "@/shared/utils/paymentDateRange";

import type { DashboardWidget } from "@/features/dashboard/config/dashboardConfig";

const formatearFechaDashboard = (
  fecha: string,
  locale: string,
): string => {
  const incluyeHora = fecha.includes("T") || fecha.includes(":");
  return incluyeHora
    ? formatPaymentDateTimeUtc(fecha, locale)
    : formatPaymentDateUtc(fecha, locale);
};

const formatearMoneda = (
  amount: number,
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount / 100);
};

const formatearNumero = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);

const formatearPorcentaje = (value: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const PanelDashboard = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "es" ? "es-MX" : "en-US";

  const dashboardConfig = useDashboard();

  const datosDashboard = obtenerDatosDashboard(
    dashboardConfig.role
  );

  const esAdmin = dashboardConfig.role === "admin";
  const tieneWidget = (widget: DashboardWidget) =>
    dashboardConfig.widgets.includes(widget);
  const graficasHabilitadas = esAdmin && tieneWidget("analytics");

  const titleKey: LlaveTraduccion = esAdmin
    ? "dashboard.admin.title"
    : "dashboard.client.title";

  const {
    data: kpisDashboard,
    isLoading: cargandoKpis,
    isFetching: actualizandoKpis,
    isError: errorKpis,
    error: errorDashboard,
    refetch: refrescarKpis,
  } = useDashboardKpis(esAdmin);
  const hourlyPerformanceResult =
    useDashboardHourlyPerformance(graficasHabilitadas);
  const pulseResult = useDashboardPulse(graficasHabilitadas);
  const statusDistributionResult =
    useDashboardStatusDistribution(graficasHabilitadas);

  // ======================================================
  // MÉTRICAS DASHBOARD
  // ======================================================

  const metricasDashboard =
    esAdmin
      ? []
      : datosDashboard.metricas;
  const statusDistributionData = statusDistributionResult.data ?? [];
  const processedOperationsTotal = statusDistributionData.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const processedOperationsValue =
    (statusDistributionResult.isLoading || statusDistributionResult.isError) &&
    statusDistributionData.length === 0
      ? null
      : processedOperationsTotal;

  const metricasBackend: Metrica[] = esAdmin && kpisDashboard
    ? [
        {
          id: "payment-intents",
          etiquetaKey: "dashboard.roleContent.admin.metrics.kpis.gmv.title",
          valor:
            kpisDashboard.gmvTotal !== null
              ? `USD ${formatearMoneda(kpisDashboard.gmvTotal)}`
              : "—",
          ayudaKey: "dashboard.roleContent.admin.metrics.kpis.gmv.helper",
          variante: "invertida",
          detallePath: ROUTE_PATHS.paymentIntents,
        },
        {
          id: "total-intentos",
          etiquetaKey: "dashboard.roleContent.admin.metrics.kpis.totalIntentos.title",
          valor:
            processedOperationsValue !== null
              ? formatearNumero(processedOperationsValue, locale)
              : "—",
          ayudaKey: "dashboard.roleContent.admin.metrics.kpis.totalIntentos.helper",
          variante: "suave",
        },
        {
          id: "successful-payments",
          etiquetaKey: "dashboard.roleContent.admin.metrics.kpis.ventasExitosas.title",
          valor:
            kpisDashboard.ventasExitosas !== null
              ? formatearNumero(kpisDashboard.ventasExitosas, locale)
              : "—",
          ayudaKey: "dashboard.roleContent.admin.metrics.kpis.ventasExitosas.helper",
          variante: "suave",
          detallePath: ROUTE_PATHS.successfulPayments,
        },
        {
          id: "conversion-rate",
          etiquetaKey: "dashboard.roleContent.admin.metrics.kpis.conversionRate.title",
          valor:
            kpisDashboard.conversionRate !== null
              ? `${formatearPorcentaje(kpisDashboard.conversionRate, locale)}%`
              : "—",
          ayudaKey: "dashboard.roleContent.admin.metrics.kpis.conversionRate.helper",
          variante: "suave",
        },
        {
          id: "ticket-promedio",
          etiquetaKey: "dashboard.roleContent.admin.metrics.kpis.ticketPromedio.title",
          valor:
            kpisDashboard.ticketPromedio !== null
              ? `USD ${formatearMoneda(kpisDashboard.ticketPromedio)}`
              : "—",
          ayudaKey: "dashboard.roleContent.admin.metrics.kpis.ticketPromedio.helper",
          variante: "suave",
        },
      ]
    : [];

  const metricasFinales =
    esAdmin
      ? metricasBackend
      : metricasDashboard;

  const mensajeErrorKpis =
    errorDashboard instanceof Error
      ? errorDashboard.message
      : t("dashboard.kpis.error");
  const pulseData = pulseResult.data ?? [];
  const hourlyPerformanceData = hourlyPerformanceResult.data ?? [];
  const mensajeErrorGraficas = t("dashboard.charts.error");
  const isRefreshingDashboard =
    actualizandoKpis ||
    hourlyPerformanceResult.isFetching ||
    pulseResult.isFetching ||
    statusDistributionResult.isFetching;
  const handleRefreshDashboard = () => {
    void Promise.all([
      refrescarKpis(),
      ...(graficasHabilitadas
        ? [
            hourlyPerformanceResult.refetch(),
            pulseResult.refetch(),
            statusDistributionResult.refetch(),
          ]
        : []),
    ]);
  };

  return (
    <div className="space-y-5">

      {/* ======================================================
          HEADER + MÉTRICAS
      ====================================================== */}

      {tieneWidget("metrics") && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">

            {/* TITULOS */}
            <div>

              {/* Título dashboard */}
              <h1 className="mb-1 text-3xl font-bold text-foreground">
                {t(titleKey)}
              </h1>

              {/* Fecha backend */}
              <p className="text-sm text-muted-foreground">
                {kpisDashboard?.fecha
                  ? `${t("dashboard.kpis.dateLabel")}: ${formatearFechaDashboard(kpisDashboard.fecha, locale)}`
                  : t("dashboard.kpis.dateUnavailable")}
              </p>

            </div>
            {esAdmin ? (
              <button
                type="button"
                onClick={handleRefreshDashboard}
                disabled={isRefreshingDashboard}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-success px-4 text-sm font-semibold text-success-foreground shadow-sm shadow-success/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw className={`h-4 w-4 ${isRefreshingDashboard ? "animate-spin" : ""}`} />
                {t("common.actions.refresh")}
              </button>
            ) : null}
          </div>

          {/* ======================================================
              GRID MÉTRICAS KPI
          ====================================================== */}

          <section className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-6">

            {/* Tarjetas métricas */}
            {metricasFinales.map((metrica) => {
              const usaTarjetaSinFlecha = [
                "total-intentos",
                "conversion-rate",
                "ticket-promedio",
              ].includes(metrica.id);

              const MetricCard = usaTarjetaSinFlecha ? GmvTotalMetricCard : TarjetaMetrica;
              const usaEspacioParaMontoLargo = [
                "payment-intents",
                "ticket-promedio",
              ].includes(metrica.id);
              const ordenTarjeta: Record<string, string> = {
                "payment-intents": "xl:order-1",
                "ticket-promedio": "xl:order-2",
                "total-intentos": "xl:order-3",
                "successful-payments": "xl:order-4",
                "conversion-rate": "xl:order-5",
              };

              return (
                <div
                  key={metrica.id}
                  className={[
                    "h-full min-w-0",
                    ordenTarjeta[metrica.id] ?? "",
                    usaEspacioParaMontoLargo ? "xl:col-span-3" : "xl:col-span-2",
                  ].join(" ")}
                >
                  <MetricCard
                    {...metrica}
                  />
                </div>
              );
            })}

            {/* Skeleton loading */}
            {esAdmin &&
            cargandoKpis &&
            metricasFinales.length === 0
              ? Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={`kpi-loading-${index}`}
                    className="h-40 animate-pulse rounded-lg border border-border bg-dashboard-soft"
                  />
                ))
              : null}
          </section>

          {/* Loading KPIs */}
          {cargandoKpis ? (
            <p className="text-xs text-muted-foreground">
              {t("dashboard.kpis.loading")}
            </p>
          ) : null}

          {/* Error backend */}
          {errorKpis ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">
                {mensajeErrorKpis}
              </p>
            </div>
          ) : null}

        </>
      )}

      {graficasHabilitadas ? (
        <section className="space-y-3">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">

            <DashboardStatusDistributionChart
              data={statusDistributionData}
              isLoading={statusDistributionResult.isLoading}
              isError={statusDistributionResult.isError}
              errorMessage={mensajeErrorGraficas}
              locale={locale}
            />

            <DashboardUtcReferenceCard locale={locale} />

          </div>

          <DashboardPulseChart
            data={pulseData}
            isLoading={pulseResult.isLoading}
            isError={pulseResult.isError}
            errorMessage={mensajeErrorGraficas}
            locale={locale}
          />

          <DashboardHourlyPerformanceChart
            data={hourlyPerformanceData}
            isLoading={hourlyPerformanceResult.isLoading}
            isError={hourlyPerformanceResult.isError}
            errorMessage={mensajeErrorGraficas}
            locale={locale}
          />

        </section>
      ) : null}

    </div>
  );
};

export default PanelDashboard;
