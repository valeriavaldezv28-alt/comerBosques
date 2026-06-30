import { Bell, CircleHelp, LogOut, Menu, ShoppingCart, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/config/routePaths";
import { customerCartStorageKey, customerCartUpdatedEvent } from "@/features/comercializadora/storage";
import { BotonTema } from "@/features/theme";
import { claseBotonIcono } from "@/shared/ui/estilosDashboard";

type BarraSuperiorProps = {
  isSidebarOpen: boolean;
  onMenuClick: () => void;
};

export const BarraSuperior = ({ isSidebarOpen, onMenuClick }: BarraSuperiorProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isCustomerProfile = location.pathname === ROUTE_PATHS.cliente;
  const isProductNewView = location.pathname === ROUTE_PATHS.dashboardProductsNew;
  const [cartQuantity, setCartQuantity] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileTargetPath = isCustomerProfile ? ROUTE_PATHS.dashboard : ROUTE_PATHS.cliente;

  useEffect(() => {
    if (!isCustomerProfile) {
      return;
    }

    const updateCartQuantity = () => {
      try {
        const storedCart = window.localStorage.getItem(customerCartStorageKey);
        const cartItems = storedCart ? (JSON.parse(storedCart) as Array<{ quantity: number }>) : [];
        setCartQuantity(cartItems.reduce((total, item) => total + item.quantity, 0));
      } catch {
        setCartQuantity(0);
      }
    };

    updateCartQuantity();
    window.addEventListener(customerCartUpdatedEvent, updateCartQuantity);
    window.addEventListener("storage", updateCartQuantity);

    return () => {
      window.removeEventListener(customerCartUpdatedEvent, updateCartQuantity);
      window.removeEventListener("storage", updateCartQuantity);
    };
  }, [isCustomerProfile]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileMenuOpen]);

  const handleProfileNavigation = () => {
    navigate(profileTargetPath);
    setIsProfileMenuOpen(false);
  };

  const handleLogout = () => {
    navigate(ROUTE_PATHS.root);
    setIsProfileMenuOpen(false);
  };

  return (
    <header
      className={`relative z-50 flex min-h-[68px] items-center justify-between gap-3 overflow-visible border-b px-4 py-3 lg:px-6 ${
        isProductNewView
          ? "border-slate-200 bg-white text-slate-950 shadow-none"
          : "border-border/70 bg-card shadow-[0_10px_28px_hsl(var(--foreground)/0.04)]"
      }`}
    >
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-controls="dashboard-sidebar-mobile"
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? "Cerrar menu" : "Abrir menu"}
          className={
            isProductNewView
              ? "inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"
              : claseBotonIcono("h-10 w-10 bg-muted lg:hidden")
          }
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {isProductNewView ? (
          <div className="hidden min-w-0 items-center gap-2 text-sm font-medium sm:flex">
            <button
              type="button"
              onClick={() => navigate(ROUTE_PATHS.dashboardProductsNew)}
              className="text-blue-600 transition hover:text-blue-800"
            >
              Productos
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Nuevo producto</span>
          </div>
        ) : (
          <div className="hidden min-w-0 sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" />
            <h1 className="truncate text-lg font-semibold text-foreground" />
          </div>
        )}

        {isCustomerProfile ? (
          <div id="customer-catalog-toolbar" className="min-w-0 flex-1 px-2 lg:px-4" />
        ) : (
          <div className="flex-1" />
        )}
        {!isProductNewView && <BotonTema />}

        <div className={`flex items-center gap-3 ${isProductNewView ? "" : "border-l border-border/70 pl-4"}`}>
          {isCustomerProfile && (
            <button
              type="button"
              onClick={() => navigate(`${ROUTE_PATHS.cliente}#pedido`)}
              aria-label="Ver carrito"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/50 hover:bg-muted hover:text-foreground"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartQuantity > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {cartQuantity}
                </span>
              )}
            </button>
          )}
          {isCustomerProfile ? (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Salir"
              className="flex items-center gap-3 rounded-lg text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card xl:py-1 xl:pl-1 xl:pr-2"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LogOut className="h-4 w-4" />
              </span>
              <span className="hidden text-right xl:block">
                <span className="block text-sm font-medium text-foreground">Salir</span>
                <span className="block text-[11px] text-muted-foreground">Cerrar sesion</span>
              </span>
            </button>
          ) : (
            <div ref={profileMenuRef} className="relative">
              {isProductNewView && (
                <>
                  <button
                    type="button"
                    aria-label="Notificaciones"
                    className="mr-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"
                  >
                    <Bell className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Ayuda"
                    className="mr-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"
                  >
                    <CircleHelp className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                aria-label="Abrir menu de perfil"
                className={`flex items-center gap-3 rounded-lg text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  isProductNewView
                    ? "hover:bg-slate-100 focus-visible:ring-offset-white xl:py-1 xl:pl-1 xl:pr-2"
                    : "hover:bg-muted focus-visible:ring-offset-card xl:py-1 xl:pl-1 xl:pr-2"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    isProductNewView ? "bg-blue-50 text-blue-700" : "bg-primary text-primary-foreground"
                  }`}
                >
                  <UserRound className="h-4 w-4" />
                </span>
                <span className="hidden text-right xl:block">
                  <span className={isProductNewView ? "block text-sm font-semibold text-slate-950" : "block text-sm font-medium text-foreground"}>Admin</span>
                  <span className={isProductNewView ? "block text-[11px] text-slate-500" : "block text-[11px] text-muted-foreground"}>Administrador</span>
                </span>
              </button>

              {isProfileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-popover p-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleProfileNavigation}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-popover-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <UserRound className="h-4 w-4 text-primary" />
                    <span>Vista cliente</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
