/**
 * Configuración centralizada de rutas de la aplicación
 * Mantiene todas las rutas en un único lugar para fácil mantenimiento
 */

import { lazy, Suspense, type ReactNode } from "react";
import { ROLES, type RolUsuario } from "../features/auth/roles";
import { DashboardLayout } from "../shared/layouts/DashboardLayout";
import { RouteFallback } from "../shared/ui/RouteFallback";
import Index from "../pages/Index";
import { PROTECTED_ROUTE_PATHS, ROUTE_PATHS } from "./routePaths";

const DASHBOARD_ADMIN_ACCESS_ROLES = [ROLES.ADMIN, ROLES.CLIENT];
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Login = lazy(() => import("../features/auth/views/LoginView"));
const NotFound = lazy(() => import("../pages/NotFound"));
const IntentsView = lazy(() => import("../features/payments/attempts/views/IntentsView"));
const RejectedView = lazy(() => import("../features/payments/rejected/views/RejectedView"));
const RefundsView = lazy(() => import("../features/payments/refunds/views/RefundsView"));
const SuccessfulView = lazy(() => import("../features/payments/successful/views/SuccessfulView"));
const TransactionsView = lazy(() => import("../features/transactions/views/TransactionsView"));

export interface RouteConfig {
  path: string;
  element: ReactNode;
  children?: RouteConfig[];
  requiresAuth?: boolean;
  allowedRoles?: RolUsuario[];
}

const withRouteSuspense = (element: ReactNode) => (
  <Suspense fallback={<RouteFallback />}>{element}</Suspense>
);

/**
 * Rutas públicas (sin autenticación requerida)
 */
export const publicRoutes: RouteConfig[] = [
  {
    path: ROUTE_PATHS.root,
    element: <Index />,
  },
  {
    path: ROUTE_PATHS.login,
    element: withRouteSuspense(<Login />),
  },
];

/**
 * Rutas protegidas (requieren autenticación + roles)
 */
export const protectedRoutes: RouteConfig[] = [
  {
    path: PROTECTED_ROUTE_PATHS.dashboard,
    element: withRouteSuspense(<Dashboard />),
    requiresAuth: true,
  },
  {
    path: PROTECTED_ROUTE_PATHS.paymentIntents,
    element: withRouteSuspense(<IntentsView />),
    requiresAuth: true,
    allowedRoles: DASHBOARD_ADMIN_ACCESS_ROLES,
  },
  {
    path: PROTECTED_ROUTE_PATHS.rejectedTransactions,
    element: withRouteSuspense(<RejectedView />),
    requiresAuth: true,
    allowedRoles: DASHBOARD_ADMIN_ACCESS_ROLES,
  },
  {
    path: PROTECTED_ROUTE_PATHS.successfulPayments,
    element: withRouteSuspense(<SuccessfulView />),
    requiresAuth: true,
    allowedRoles: DASHBOARD_ADMIN_ACCESS_ROLES,
  },
  {
    path: PROTECTED_ROUTE_PATHS.refunds,
    element: withRouteSuspense(<RefundsView />),
    requiresAuth: true,
    allowedRoles: DASHBOARD_ADMIN_ACCESS_ROLES,
  },
  {
    path: PROTECTED_ROUTE_PATHS.transactions,
    element: withRouteSuspense(<TransactionsView />),
    requiresAuth: true,
    allowedRoles: DASHBOARD_ADMIN_ACCESS_ROLES,
  },
];

/**
 * Rutas de error (fallback)
 */
export const errorRoutes: RouteConfig[] = [
  {
    path: "*",
    element: withRouteSuspense(<NotFound />),
  },
];

/**
 * Configuración completa de rutas
 */
export const appRoutes: RouteConfig[] = [
  ...publicRoutes,
  {
    path: ROUTE_PATHS.root,
    element: <DashboardLayout />,
    requiresAuth: true,
    children: protectedRoutes,
  },
  ...errorRoutes,
];
