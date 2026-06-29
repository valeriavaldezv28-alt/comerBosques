import {
  BarChart3,
  Boxes,
  CreditCard,
  HelpCircle,
  LogOut,
  PackageMinus,
  PackagePlus,
  ShoppingCart,
  Store,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/config/routePaths";

type BarraLateralProps = {
  mode: "desktop" | "mobile";
  isOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
};

const adminMenuItems = [
  {
    key: "inventory",
    icon: Boxes,
    label: "Inventario",
    path: ROUTE_PATHS.dashboard,
  },
  {
    key: "entries",
    icon: PackagePlus,
    label: "Entradas",
    path: ROUTE_PATHS.dashboard,
  },
  {
    key: "exits",
    icon: PackageMinus,
    label: "Salidas",
    path: ROUTE_PATHS.dashboard,
  },
  {
    key: "sales",
    icon: Store,
    label: "Ventas",
    path: ROUTE_PATHS.dashboard,
  },
  {
    key: "customers",
    icon: UsersRound,
    label: "Clientes",
    path: ROUTE_PATHS.dashboardCustomers,
  },
  {
    key: "reports",
    icon: BarChart3,
    label: "Reportes",
    path: ROUTE_PATHS.dashboard,
  },
] as const;

const customerMenuItems = [
  {
    key: "catalog",
    icon: Store,
    label: "Catalogo",
    path: ROUTE_PATHS.cliente,
  },
  {
    key: "cart",
    icon: ShoppingCart,
    label: "Mi pedido",
    path: `${ROUTE_PATHS.cliente}#pedido`,
  },
  {
    key: "payment",
    icon: CreditCard,
    label: "Mis compras",
    path: `${ROUTE_PATHS.cliente}#pago`,
  },
] as const;

export const BarraLateral = ({
  mode,
  isOpen = false,
  onClose,
  onNavigate,
}: BarraLateralProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCustomerProfile = location.pathname === ROUTE_PATHS.cliente;
  const menuItems = isCustomerProfile ? customerMenuItems : adminMenuItems;

  useEffect(() => {
    if (mode !== "mobile" || !isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, mode, onClose]);

  const manejarNavegacion = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const manejarSalida = () => {
    navigate(ROUTE_PATHS.root);
    onNavigate?.();
  };

  const contenidoSidebar = (
    <>
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/25 ring-1 ring-primary/20">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-sm font-bold text-foreground">Comercializadora Bosques</span>
            <span className="block truncate text-sm font-bold text-foreground">Vista Cliente</span>
          </div>
        </div>
        {mode === "mobile" && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {isCustomerProfile ? "Cliente" : "Operacion"}
      </p>

      <nav className="space-y-1.5">
        {menuItems.map((item) => {
          const [itemPath, itemHash = ""] = item.path.split("#");
          const active = isCustomerProfile
            ? location.pathname === itemPath && location.hash === (itemHash ? `#${itemHash}` : "")
            : item.path === ROUTE_PATHS.dashboard
              ? location.pathname === itemPath && item.key === "inventory"
              : location.pathname === itemPath;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => manejarNavegacion(item.path)}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-primary/10 text-foreground shadow-sm shadow-primary/10 ring-1 ring-primary/15"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition ${
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                }`}
              />
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  active ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-transparent group-hover:bg-background"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 pt-8">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/70 p-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-sidebar-accent-foreground">
            <UsersRound className="h-[18px] w-[18px] text-primary" />
            {isCustomerProfile ? "Perfil cliente" : "Almacen central"}
          </div>
          <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
            {isCustomerProfile ? "Compra publica y pago" : "Recepcion y surtido activos"}
          </p>
        </div>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
          <span>Ayuda</span>
        </button>
        {!isCustomerProfile && (
          <button
            type="button"
            onClick={manejarSalida}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>Salir</span>
          </button>
        )}
      </div>
    </>
  );

  if (mode === "desktop") {
    return (
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border/70 bg-sidebar/95 p-4 shadow-[12px_0_30px_hsl(var(--foreground)/0.035)] lg:flex">
        {contenidoSidebar}
      </aside>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar menu"
        className={`absolute inset-0 bg-black/50 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        id="dashboard-sidebar-mobile"
        className={`relative flex h-full w-72 flex-col bg-sidebar p-4 shadow-2xl transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {contenidoSidebar}
      </aside>
    </div>
  );
};
