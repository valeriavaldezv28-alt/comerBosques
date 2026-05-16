import { Pause, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { tiempoSesion, type LlaveTraduccion } from "../data";
import { claseBotonIcono, claseTarjetaInvertida } from "@/shared/ui/estilosDashboard";

interface ControlTiempoProps {
  tiempo?: string;
  titleKey?: LlaveTraduccion;
}

export const ControlTiempo = ({ tiempo = tiempoSesion, titleKey = "dashboard.timer.title" }: ControlTiempoProps) => {
  const { t } = useTranslation();

  return (
    <div className={claseTarjetaInvertida("relative flex flex-col overflow-hidden p-6") }>
      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full border border-dashboard-inverted-foreground/10" />
      <div className="absolute bottom-4 right-4 h-24 w-24 rounded-full border border-dashboard-inverted-foreground/10" />
      <p className="mb-2 text-sm text-dashboard-inverted-foreground/70">{t(titleKey)}</p>
      <p className="mb-5 font-mono text-4xl font-bold tabular-nums tracking-tight text-dashboard-inverted-foreground">
        {tiempo}
      </p>
      <div className="mt-auto flex gap-3">
        <button
          type="button"
          aria-label={t("dashboard.timer.actions.pause")}
          className={claseBotonIcono("h-11 w-11 bg-dashboard-inverted-foreground/10 text-dashboard-inverted-foreground hover:bg-dashboard-inverted-foreground/20")}
        >
          <Pause className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={t("dashboard.timer.actions.stop")}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition hover:brightness-105"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
};
