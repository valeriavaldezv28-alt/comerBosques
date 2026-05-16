import { useQuery } from "@tanstack/react-query";
import { ENV } from "@/shared/config/env";
import {
  getDashboardHourlyPerformance,
  getDashboardPulse,
  getDashboardStatusDistribution,
} from "../domain/dashboardDomain";

const opcionesConsultaDashboard = (enabled: boolean) => ({
  enabled,
  retry: ENV.API_RETRY_LIMIT,
  refetchInterval: ENV.DASHBOARD_REFRESH_INTERVAL,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
});

export const useDashboardHourlyPerformance = (enabled: boolean) =>
  useQuery({
    queryKey: ["dashboard", "hourly-performance"],
    queryFn: getDashboardHourlyPerformance,
    ...opcionesConsultaDashboard(enabled),
  });

export const useDashboardPulse = (enabled: boolean) =>
  useQuery({
    queryKey: ["dashboard", "pulse"],
    queryFn: getDashboardPulse,
    ...opcionesConsultaDashboard(enabled),
  });

export const useDashboardStatusDistribution = (enabled: boolean) =>
  useQuery({
    queryKey: ["dashboard", "status-distribution"],
    queryFn: getDashboardStatusDistribution,
    ...opcionesConsultaDashboard(enabled),
  });
