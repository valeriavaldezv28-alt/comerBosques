export interface DashboardHourlyApiItem {
  hora?: number | string;
  intentos?: number | string;
  exitos?: number | string;
  volumenVentas?: number | string;
  horaLocal?: number | string;
  horaUtc?: number | string;
}

export interface DashboardPulseApiItem {
  hora?: number | string;
  horaLocal?: number | string;
  horaUtc?: number | string;
  totalTransacciones?: number | string;
  volumenDinero?: number | string;
}

export interface DashboardStatusDistributionApiItem {
  status?: string;
  count?: number | string;
}

type ApiListResponse<T> =
  | T[]
  | {
      data?: T[] | T;
      items?: T[] | T;
      result?: T[] | T;
      results?: T[] | T;
    };

export type DashboardHourlyApiResponse = ApiListResponse<DashboardHourlyApiItem>;
export type DashboardPulseApiResponse = ApiListResponse<DashboardPulseApiItem>;
export type DashboardStatusDistributionApiResponse =
  ApiListResponse<DashboardStatusDistributionApiItem>;

export interface DashboardHourlyPerformance {
  hour: number;
  attempts: number;
  successes: number;
  salesVolume: number;
}

export interface DashboardPulsePoint {
  hour: number;
  transactionCount: number;
  moneyVolume: number;
}

export interface DashboardStatusDistributionPoint {
  status: string;
  count: number;
}
