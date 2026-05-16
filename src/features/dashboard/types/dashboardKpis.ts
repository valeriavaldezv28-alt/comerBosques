export interface DashboardKpisApiItem {
  fecha?: string;
  totalIntentos?: number | string;
  ventasExitosas?: number | string;
  conversionRate?: number | string;
  gmvTotal?: number | string;
  ticketPromedio?: number | string;
  currency?: string;
}

export type DashboardKpisApiResponse =
  | DashboardKpisApiItem[]
  | {
      data?: DashboardKpisApiItem[] | DashboardKpisApiItem;
      kpis?: DashboardKpisApiItem[] | DashboardKpisApiItem;
      result?: DashboardKpisApiItem[] | DashboardKpisApiItem;
      fecha?: string;
      totalIntentos?: number | string;
      ventasExitosas?: number | string;
      conversionRate?: number | string;
      gmvTotal?: number | string;
      ticketPromedio?: number | string;
      currency?: string;
    };

export interface DashboardKpis {
  fecha: string | null;
  totalIntentos: number | null;
  ventasExitosas: number | null;
  conversionRate: number | null;
  gmvTotal: number | null;
  ticketPromedio: number | null;
  currency: string | null;
}
