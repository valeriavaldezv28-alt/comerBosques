import { apiClient } from "@/shared/api/apiClient";
import { API_ENDPOINTS } from "@/shared/api/apiConfig";
import { getUtcTodayRange } from "@/shared/utils/paymentDateRange";
import type {
  DashboardHourlyApiResponse,
  DashboardPulseApiResponse,
  DashboardStatusDistributionApiResponse,
} from "../types/dashboardCharts";
import type { DashboardKpisApiResponse } from "../types/dashboardKpis";

const withCurrentUtcDayRange = (endpoint: string): string => {
  const { from, to } = getUtcTodayRange();
  const searchParams = new URLSearchParams({
    from,
    to,
  });
  return `${endpoint}?${searchParams.toString()}`;
};

const withBrowserTimeZone = (endpoint: string): string => {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const searchParams = new URLSearchParams({
    tz: timeZone,
  });

  return `${endpoint}?${searchParams.toString()}`;
};

export const fetchDashboardKpis = async (): Promise<DashboardKpisApiResponse> =>
  apiClient<DashboardKpisApiResponse>(
    withCurrentUtcDayRange(API_ENDPOINTS.dashboard.kpis),
  );

export const fetchDashboardHourlyPerformance =
  async (): Promise<DashboardHourlyApiResponse> =>
    apiClient<DashboardHourlyApiResponse>(
      withBrowserTimeZone(API_ENDPOINTS.dashboard.hourly),
    );

export const fetchDashboardPulse = async (): Promise<DashboardPulseApiResponse> =>
  apiClient<DashboardPulseApiResponse>(
    withBrowserTimeZone(API_ENDPOINTS.dashboard.pulse),
  );

export const fetchDashboardStatusDistribution =
  async (): Promise<DashboardStatusDistributionApiResponse> =>
    apiClient<DashboardStatusDistributionApiResponse>(
      withCurrentUtcDayRange(API_ENDPOINTS.dashboard.statusDistribution),
    );
