import { Menu, ShoppingCart, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [cartQuantity, setCartQuantity] = useState(0);

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

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border/70 bg-card px-4 py-3 shadow-[0_10px_28px_hsl(var(--foreground)/0.04)] lg:px-6">
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-controls="dashboard-sidebar-mobile"
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? "Cerrar menu" : "Abrir menu"}
          className={claseBotonIcono("h-10 w-10 bg-muted lg:hidden")}
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <div className="hidden min-w-0 sm:block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {isCustomerProfile ? "Vista publica" : "Panel ERP"}
          </p>
          <h1 className="truncate text-lg font-semibold text-foreground">
            {isCustomerProfile ? "Cliente" : "Inventario"}
          </h1>
        </div>

        <div className="flex-1" />
        <BotonTema />

        <div className="flex items-center gap-3 border-l border-border/70 pl-4">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="hidden text-right xl:block">
            <p className="text-sm font-medium text-foreground">{isCustomerProfile ? "Cliente" : "Valeria"}</p>
            <p className="text-[11px] text-muted-foreground">
              {isCustomerProfile ? "Compra publica" : "Administracion"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
