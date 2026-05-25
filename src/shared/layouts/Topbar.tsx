import { Menu, UserRound, X } from "lucide-react";
import { BotonTema } from "@/features/theme";
import { claseBotonIcono } from "@/shared/ui/estilosDashboard";

type BarraSuperiorProps = {
  isSidebarOpen: boolean;
  onMenuClick: () => void;
};

export const BarraSuperior = ({ isSidebarOpen, onMenuClick }: BarraSuperiorProps) => {
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
            Panel ERP
          </p>
          <h1 className="truncate text-lg font-semibold text-foreground">Inventario</h1>
        </div>

        <div className="flex-1" />
        <BotonTema />

        <div className="flex items-center gap-3 border-l border-border/70 pl-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="hidden text-right xl:block">
            <p className="text-sm font-medium text-foreground">Valeria</p>
            <p className="text-[11px] text-muted-foreground">Administracion</p>
          </div>
        </div>
      </div>
    </header>
  );
};
