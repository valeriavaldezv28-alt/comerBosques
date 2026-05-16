import type {
  DashboardHourlyApiResponse,
  DashboardHourlyPerformance,
  DashboardPulseApiResponse,
  DashboardPulsePoint,
  DashboardStatusDistributionApiResponse,
  DashboardStatusDistributionPoint,
} from "../types/dashboardCharts";

const esRegistro = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const extraerLista = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!esRegistro(payload)) {
    return [];
  }

  const posiblesContenedores = [
    payload.data,
    payload.items,
    payload.result,
    payload.results,
  ];

  for (const contenedor of posiblesContenedores) {
    if (Array.isArray(contenedor)) {
      return contenedor;
    }

    if (esRegistro(contenedor)) {
      return [contenedor];
    }
  }

  return [payload];
};

const obtenerNumero = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const obtenerHora = (value: unknown): number | null => {
  const parsed = obtenerNumero(value);

  if (parsed === null) {
    return null;
  }

  const hour = Math.trunc(parsed);
  return hour >= 0 && hour <= 23 ? hour : null;
};

const ordenarPorHora = <T extends { hour: number }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.hour - b.hour);

const STATUS_SUCCEEDED = "SUCCEEDED";
const STATUS_LINK_CREATED = "LINK_CREATED";

const normalizarStatusDistribucion = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedStatus = value.trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (normalizedStatus === STATUS_SUCCEEDED || normalizedStatus === "SUCCEDED") {
    return STATUS_SUCCEEDED;
  }

  if (normalizedStatus === STATUS_LINK_CREATED) {
    return STATUS_LINK_CREATED;
  }

  return null;
};

export const mapDashboardHourlyPerformance = (
  payload: DashboardHourlyApiResponse,
): DashboardHourlyPerformance[] =>
  ordenarPorHora(
    extraerLista(payload).flatMap((item) => {
      if (!esRegistro(item)) {
        return [];
      }

      const hour = obtenerHora(item.horaLocal ?? item.hora);

      if (hour === null) {
        return [];
      }

      return [
        {
          hour,
          attempts: obtenerNumero(item.intentos) ?? 0,
          successes: obtenerNumero(item.exitos) ?? 0,
          salesVolume: (obtenerNumero(item.volumenVentas) ?? 0) / 100,
        },
      ];
    }),
  );

export const mapDashboardPulse = (
  payload: DashboardPulseApiResponse,
): DashboardPulsePoint[] =>
  ordenarPorHora(
    extraerLista(payload).flatMap((item) => {
      if (!esRegistro(item)) {
        return [];
      }

      const hour = obtenerHora(item.horaLocal ?? item.hora);

      if (hour === null) {
        return [];
      }

      return [
        {
          hour,
          transactionCount: obtenerNumero(item.totalTransacciones) ?? 0,
          moneyVolume: obtenerNumero(item.volumenDinero) ?? 0,
        },
      ];
    }),
  );

export const mapDashboardStatusDistribution = (
  payload: DashboardStatusDistributionApiResponse,
): DashboardStatusDistributionPoint[] =>
  extraerLista(payload).flatMap((item) => {
    if (!esRegistro(item)) {
      return [];
    }

    const status = normalizarStatusDistribucion(item.status);
    const count = obtenerNumero(item.count) ?? 0;

    if (status === null || count <= 0) {
      return [];
    }

    return [{ status, count }];
  });
