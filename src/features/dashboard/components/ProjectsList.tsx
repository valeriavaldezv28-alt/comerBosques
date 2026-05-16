import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { proyectos, type LlaveTraduccion, type ProyectoDashboard } from "../data";
import { claseTarjeta, claseTonoSuave } from "@/shared/ui/estilosDashboard";
import { formatPaymentDateUtc } from "@/shared/utils/paymentDateRange";

interface ListaProyectosProps {
  proyectosListado?: ProyectoDashboard[];
  titleKey?: LlaveTraduccion;
  actionKey?: LlaveTraduccion;
}

export const ListaProyectos = ({
  proyectosListado = proyectos,
  titleKey = "dashboard.projects.title",
  actionKey = "dashboard.projects.new",
}: ListaProyectosProps) => {
  const { t, i18n } = useTranslation();
  const activeLocale = i18n.resolvedLanguage === "es" ? "es-AR" : "en-US";

  return (
    <div className={claseTarjeta("base", "p-6")}>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{t(titleKey)}</h3>
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> {t(actionKey)}
        </button>
      </div>
      <ul className="space-y-4">
        {proyectosListado.map((proyecto) => (
          <li key={proyecto.id} className="flex items-start gap-3">
            <div className={claseTonoSuave(proyecto.tono, "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold")}>
              {t(proyecto.nombreKey).charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{t(proyecto.nombreKey)}</p>
              <p className="text-[11px] text-muted-foreground">
                {t("dashboard.projects.due", {
                  date: formatPaymentDateUtc(proyecto.vencimiento, activeLocale),
                })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
