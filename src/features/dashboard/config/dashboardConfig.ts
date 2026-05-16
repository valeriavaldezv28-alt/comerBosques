/**
 * Configuracion dinamica del dashboard basada en roles.
 * Fuente unica de verdad para menu y widgets.
 */

import { ROLES, type RolUsuario } from "@/features/auth/roles";
import { ROUTE_PATHS } from "@/config/routePaths";

export type DashboardWidget =
  | "metrics"
  | "analytics"
  | "projects"
  | "team"
  | "progress"
  | "reminder"
  | "time";

export type DashboardMenuLabel =
  | "sidebar.menu.dashboard"
  | "sidebar.menu.paymentIntents"
  | "sidebar.menu.rejectedTransactions"
  | "sidebar.menu.successfulPayments"
  | "sidebar.menu.refunds"
  | "sidebar.menu.transactions";

export interface DashboardMenuItem {
  key: string;
  label: DashboardMenuLabel;
  path: string;
  badge?: string;
}

export interface DashboardConfig {
  role: RolUsuario;
  widgets: DashboardWidget[];
  menuItems: DashboardMenuItem[];
}

/**
 * Widgets base (pueden evolucionar por rol después)
 */
const widgetsBase: DashboardWidget[] = [
  "metrics",
  "analytics",
  "projects",
  "team",
  "progress",
  "reminder",
  "time",
];

/**
 * 🔴 ADMIN → vista "Platform"
 */
const menuAdmin: DashboardMenuItem[] = [
  { key: "dashboard", label: "sidebar.menu.dashboard", path: ROUTE_PATHS.dashboard },
  { key: "payment-intents", label: "sidebar.menu.paymentIntents", path: ROUTE_PATHS.paymentIntents },
  { key: "rejected-transactions", label: "sidebar.menu.rejectedTransactions", path: ROUTE_PATHS.rejectedTransactions },
  { key: "successful-payments", label: "sidebar.menu.successfulPayments", path: ROUTE_PATHS.successfulPayments },
  { key: "refunds", label: "sidebar.menu.refunds", path: ROUTE_PATHS.refunds },
  { key: "transactions", label: "sidebar.menu.transactions", path: ROUTE_PATHS.transactions },
];

/**
 * Configuracion por rol
 */
const dashboardPorRol: Record<RolUsuario, DashboardConfig> = {
  [ROLES.ADMIN]: {
    role: ROLES.ADMIN,
    widgets: widgetsBase,
    menuItems: menuAdmin,
  },
  [ROLES.CLIENT]: {
    role: ROLES.ADMIN,
    widgets: widgetsBase,
    menuItems: menuAdmin,
  },
};

export const obtenerConfigDashboard = (role: RolUsuario): DashboardConfig =>
  dashboardPorRol[role];
