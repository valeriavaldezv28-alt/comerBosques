import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { miembrosEquipo, type LlaveTraduccion, type MiembroEquipoDashboard } from "../data";
import { claseAvatarTono, claseTarjeta, claseTonoSuave } from "@/shared/ui/estilosDashboard";

interface ColaboracionEquipoProps {
  miembros?: MiembroEquipoDashboard[];
  titleKey?: LlaveTraduccion;
  actionKey?: LlaveTraduccion;
}

export const ColaboracionEquipo = ({
  miembros = miembrosEquipo,
  titleKey = "dashboard.team.title",
  actionKey = "dashboard.team.invite",
}: ColaboracionEquipoProps) => {
  const { t } = useTranslation();

  return (
    <div className={claseTarjeta("base", "p-6") }>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{t(titleKey)}</h3>
        <button
          type="button"
          className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs text-foreground transition hover:bg-muted"
        >
          <Plus className="h-3 w-3" /> {t(actionKey)}
        </button>
      </div>
      <ul className="space-y-4">
        {miembros.map((miembro) => (
          <li key={miembro.id} className="flex items-center gap-3">
            <div className={claseAvatarTono(miembro.tono, "h-9 w-9 rounded-full")} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{t(miembro.nombreKey)}</p>
              <p className="truncate text-[11px] text-muted-foreground">{t(miembro.tareaKey)}</p>
            </div>
            <span className={claseTonoSuave(miembro.tono, "rounded-full px-2 py-1 text-[10px] font-medium")}>
              {t(miembro.estadoKey)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
