export const ROUTE_PATHS = {
  root: "/",
  dashboard: "/dashboard",
  dashboardCustomers: "/dashboard/customers",
  cliente: "/cliente",
  registerCustomer: "/register-customer",
} as const;

export const PROTECTED_ROUTE_PATHS = {
  dashboard: "dashboard",
  dashboardCustomers: "dashboard/customers",
  cliente: "cliente",
} as const;
