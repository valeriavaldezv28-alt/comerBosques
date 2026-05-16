import { ArrowUpRight, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { Metrica } from "../data";
import { claseTarjeta } from "@/shared/ui/estilosDashboard";

export const TarjetaMetrica = ({
  etiquetaKey,
  etiqueta: etiquetaTexto,
  valor,
  ayudaKey,
  ayuda: ayudaTexto,
  variante,
  detallePath,
}: Metrica) => {
  const { t } = useTranslation();
  const esInvertida = variante === "invertida";
  const etiqueta = etiquetaTexto ?? (etiquetaKey ? t(etiquetaKey) : "");
  const ayuda = ayudaTexto ?? (ayudaKey ? t(ayudaKey) : "");
  const claseAccion = `flex h-6 w-6 flex-shrink-0 items-center justify-center justify-self-end rounded-full sm:h-7 sm:w-7 ${
    esInvertida ? "bg-dashboard-inverted-foreground text-dashboard-inverted" : "border border-foreground/25 bg-card text-foreground"
  }`;
  const etiquetaAccion = t("dashboard.metrics.viewMetric", { label: etiqueta });

  return (
    <div className={claseTarjeta(variante, "flex h-full min-h-40 flex-col p-4 text-center sm:p-5")}>
      <div className="mb-4 grid min-h-10 grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-start gap-3">
        <span aria-hidden="true" />
        <p className={`min-w-0 text-xs font-semibold leading-snug sm:text-sm ${esInvertida ? "text-dashboard-inverted-foreground" : "text-foreground"}`}>
          {etiqueta}
        </p>
        {detallePath ? (
          <Link to={detallePath} aria-label={etiquetaAccion} className={claseAccion}>
            <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Link>
        ) : (
          <button type="button" aria-label={etiquetaAccion} className={claseAccion}>
            <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center justify-end">
        <p
          className={`mb-3 w-full whitespace-normal break-words text-center text-3xl font-bold leading-none tracking-normal sm:text-4xl ${
            esInvertida ? "text-dashboard-inverted-foreground" : "text-foreground"
          }`}
        >
          {valor}
        </p>
        <div
          className={`inline-flex min-h-7 max-w-full items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-center text-[11px] leading-tight ${
            esInvertida ? "bg-dashboard-inverted-foreground/10 text-dashboard-inverted-foreground/80" : "bg-success/10 text-success"
          }`}
        >
          <TrendingUp className="h-3 w-3" />
          {ayuda}
        </div>
      </div>
    </div>
  );
};
