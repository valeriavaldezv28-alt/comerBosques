import {
  fetchDashboardHourlyPerformance,
  fetchDashboardKpis,
  fetchDashboardPulse,
  fetchDashboardStatusDistribution,
} from "../api/dashboardApi";
import {
  mapDashboardHourlyPerformance,
  mapDashboardPulse,
  mapDashboardStatusDistribution,
} from "../mappers/dashboardChartsMapper";
import { mapDashboardKpis } from "../mappers/dashboardKpisMapper";
import type {
  DashboardHourlyPerformance,
  DashboardPulsePoint,
  DashboardStatusDistributionPoint,
} from "../types/dashboardCharts";
import type { DashboardKpis } from "../types/dashboardKpis";

export const getDashboardKpis = async (): Promise<DashboardKpis> => {
  const payload = await fetchDashboardKpis();
  return mapDashboardKpis(payload);
};

export const getDashboardHourlyPerformance =
  async (): Promise<DashboardHourlyPerformance[]> => {
    const payload = await fetchDashboardHourlyPerformance();
    return mapDashboardHourlyPerformance(payload);
  };

export const getDashboardPulse = async (): Promise<DashboardPulsePoint[]> => {
  const payload = await fetchDashboardPulse();
  return mapDashboardPulse(payload);
};

export const getDashboardStatusDistribution =
  async (): Promise<DashboardStatusDistributionPoint[]> => {
    const payload = await fetchDashboardStatusDistribution();
    return mapDashboardStatusDistribution(payload);
  };
