import {
  ArrowLeftRight,
  Barcode,
  BarChart3,
  Boxes,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  HelpCircle,
  Inbox,
  Layers3,
  LogOut,
  Package,
  PackageCheck,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Tags,
  UserCog,
  UsersRound,
  X,
  type LucideIcon,
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

type MenuItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  path: string;
};

type MenuGroup = {
  label?: string;
  items: MenuItem[];
};

const adminMenuGroups: MenuGroup[] = [
  {
    items: [
      {
        key: "dashboard",
        icon: Gauge,
        label: "Dashboard",
        path: ROUTE_PATHS.dashboard,
      },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { key: "products", icon: Package, label: "Productos", path: ROUTE_PATHS.dashboardProductsNew },
      { key: "categories", icon: Tags, label: "Categorías", path: ROUTE_PATHS.dashboardCategories },
      { key: "brands", icon: PackageCheck, label: "Marcas", path: ROUTE_PATHS.dashboardBrands },
      { key: "units", icon: Ruler, label: "Unidades de medida", path: ROUTE_PATHS.dashboardUnits },
      { key: "barcodes", icon: Barcode, label: "Códigos de barras", path: ROUTE_PATHS.dashboardBarcodes },
    ],
  },
  {
    label: "Inventario",
    items: [
      { key: "stock", icon: Boxes, label: "Existencias", path: ROUTE_PATHS.dashboardStock },
      { key: "movements", icon: ArrowLeftRight, label: "Movimientos", path: ROUTE_PATHS.dashboardMovements },
      { key: "adjustments", icon: SlidersHorizontal, label: "Ajustes", path: ROUTE_PATHS.dashboardAdjustments },
    ],
  },
  {
    label: "Compras",
    items: [
      { key: "suppliers", icon: UsersRound, label: "Proveedores", path: ROUTE_PATHS.dashboardSuppliers },
      { key: "purchase-orders", icon: ClipboardList, label: "Órdenes de compra", path: ROUTE_PATHS.dashboardPurchaseOrders },
      { key: "receptions", icon: Inbox, label: "Recepciones", path: ROUTE_PATHS.dashboardReceptions },
    ],
  },
  {
    label: "Ventas",
    items: [
      { key: "customers", icon: UsersRound, label: "Clientes", path: ROUTE_PATHS.dashboardCustomers },
      { key: "orders", icon: ShoppingCart, label: "Pedidos", path: ROUTE_PATHS.dashboardOrders },
      { key: "invoices", icon: FileText, label: "Facturas", path: ROUTE_PATHS.dashboardInvoices },
    ],
  },
  {
    label: "Reportes",
    items: [
      { key: "inventory-report", icon: Layers3, label: "Inventario", path: ROUTE_PATHS.dashboardInventoryReport },
      { key: "sales-report", icon: BarChart3, label: "Ventas", path: ROUTE_PATHS.dashboardSalesReport },
      { key: "purchases-report", icon: ClipboardList, label: "Compras", path: ROUTE_PATHS.dashboardPurchasesReport },
    ],
  },
  {
    label: "Configuración",
    items: [
      { key: "warehouses", icon: Building2, label: "Almacenes", path: ROUTE_PATHS.dashboardWarehouses },
      { key: "users", icon: UserCog, label: "Usuarios", path: ROUTE_PATHS.dashboardUsers },
      { key: "roles", icon: ShieldCheck, label: "Roles", path: ROUTE_PATHS.dashboardRoles },
    ],
  },
];

const customerMenuGroups: MenuGroup[] = [
  {
    label: "Cliente",
    items: [
      { key: "catalog", icon: Store, label: "Catálogo", path: ROUTE_PATHS.cliente },
      { key: "cart", icon: ShoppingCart, label: "Mi pedido", path: `${ROUTE_PATHS.cliente}#pedido` },
      { key: "payment", icon: CreditCard, label: "Mis compras", path: `${ROUTE_PATHS.cliente}#pago` },
    ],
  },
];

const isPathActive = (pathname: string, hash: string, item: MenuItem, isCustomerProfile: boolean) => {
  const [itemPath, itemHash = ""] = item.path.split("#");

  if (isCustomerProfile) {
    return pathname === itemPath && hash === (itemHash ? `#${itemHash}` : "");
  }

  if (item.path === ROUTE_PATHS.dashboard) {
    return pathname === ROUTE_PATHS.dashboard;
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

export const BarraLateral = ({
  mode,
  isOpen = false,
  onClose,
  onNavigate,
}: BarraLateralProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCustomerProfile = location.pathname === ROUTE_PATHS.cliente;
  const menuGroups = isCustomerProfile ? customerMenuGroups : adminMenuGroups;

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
      <div className="mb-7 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white shadow-lg shadow-blue-950/20">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-[15px] font-bold leading-5 text-white">Comercializadora</span>
            <span className="block truncate text-sm font-medium leading-5 text-slate-300">
              {isCustomerProfile ? "Cliente" : "Mayorista"}
            </span>
          </div>
        </div>
        {mode === "mobile" && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="space-y-5">
        {menuGroups.map((group, groupIndex) => (
          <div key={group.label ?? `group-${groupIndex}`} className="space-y-1">
            {group.label && (
              <p className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {group.label}
              </p>
            )}

            {group.items.map((item) => {
              const active = isPathActive(location.pathname, location.hash, item, isCustomerProfile);
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => manejarNavegacion(item.path)}
                  className={`group relative flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className={`h-[17px] w-[17px] shrink-0 ${active ? "text-white" : "text-slate-300"}`} />
                  <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto space-y-2 pt-8">
        <button
          type="button"
          className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <HelpCircle className="h-[17px] w-[17px]" />
          <span>Ayuda</span>
        </button>
        {!isCustomerProfile && (
          <button
            type="button"
            onClick={manejarSalida}
            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[17px] w-[17px]" />
            <span>Salir</span>
          </button>
        )}
      </div>
    </>
  );

  if (mode === "desktop") {
    return (
      <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col overflow-y-auto border-r border-slate-950 bg-[#0b1f33] p-5 shadow-[10px_0_28px_rgba(15,23,42,0.16)] lg:flex">
        {contenidoSidebar}
      </aside>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 lg:hidden ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar menú"
        className={`absolute inset-0 bg-black/50 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        id="dashboard-sidebar-mobile"
        className={`relative flex h-full w-72 flex-col overflow-y-auto bg-[#0b1f33] p-5 shadow-2xl transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {contenidoSidebar}
      </aside>
    </div>
  );
};
