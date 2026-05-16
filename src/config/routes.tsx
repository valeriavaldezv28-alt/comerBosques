import { lazy, Suspense, type ReactNode } from "react";
import { DashboardLayout } from "../shared/layouts/DashboardLayout";
import { RouteFallback } from "../shared/ui/RouteFallback";
import Index from "../pages/Index";
import { PROTECTED_ROUTE_PATHS, ROUTE_PATHS } from "./routePaths";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const NotFound = lazy(() => import("../pages/NotFound"));

export interface RouteConfig {
  path: string;
  element: ReactNode;
  children?: RouteConfig[];
}

const withRouteSuspense = (element: ReactNode) => (
  <Suspense fallback={<RouteFallback />}>{element}</Suspense>
);

export const publicRoutes: RouteConfig[] = [
  {
    path: ROUTE_PATHS.root,
    element: <Index />,
  },
];

export const dashboardRoutes: RouteConfig[] = [
  {
    path: PROTECTED_ROUTE_PATHS.dashboard,
    element: withRouteSuspense(<Dashboard />),
  },
];

export const errorRoutes: RouteConfig[] = [
  {
    path: "*",
    element: withRouteSuspense(<NotFound />),
  },
];

export const appRoutes: RouteConfig[] = [
  ...publicRoutes,
  {
    path: ROUTE_PATHS.root,
    element: <DashboardLayout />,
    children: dashboardRoutes,
  },
  ...errorRoutes,
];
