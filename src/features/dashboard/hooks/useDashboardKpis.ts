import { useQuery } from "@tanstack/react-query";
import { ENV } from "@/shared/config/env";
import { getDashboardKpis } from "../domain/dashboardDomain";

export const useDashboardKpis = (enabled: boolean) =>
  useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: getDashboardKpis,
    enabled,
    retry: ENV.API_RETRY_LIMIT,
    refetchInterval: ENV.DASHBOARD_REFRESH_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
