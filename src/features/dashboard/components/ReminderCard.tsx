import { Clock, Video } from "lucide-react";
import { useTranslation } from "react-i18next";
import { recordatorio, type LlaveTraduccion, type RecordatorioDashboard } from "../data";
import { claseBotonPrimario, claseTarjeta } from "@/shared/ui/estilosDashboard";

interface TarjetaRecordatorioProps {
  recordatorioActual?: RecordatorioDashboard;
  sectionTitleKey?: LlaveTraduccion;
  actionKey?: LlaveTraduccion;
}

export const TarjetaRecordatorio = ({
  recordatorioActual = recordatorio,
  sectionTitleKey = "dashboard.reminder.sectionTitle",
  actionKey = "dashboard.reminder.action",
}: TarjetaRecordatorioProps) => {
  const { t } = useTranslation();

  return (
    <div className={claseTarjeta("base", "flex flex-col p-6") }>
      <h3 className="mb-4 text-base font-semibold text-foreground">{t(sectionTitleKey)}</h3>
      <p className="mb-3 text-lg font-semibold leading-snug text-foreground">{t(recordatorioActual.tituloKey)}</p>
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {t("dashboard.reminder.today", { time: recordatorioActual.horario })}
      </div>
      <button
        type="button"
        className={claseBotonPrimario("mt-auto h-11 gap-2 text-sm")}
      >
        <Video className="h-4 w-4" />
        {t(actionKey)}
      </button>
    </div>
  );
};
