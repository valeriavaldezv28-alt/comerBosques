import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { claseBotonIcono } from "@/shared/ui/estilosDashboard";
import { useModoTema } from "../useThemeMode";

export const BotonTema = () => {
  const { t } = useTranslation();
  const { esModoOscuro, alternarModoTema } = useModoTema();
  const etiqueta = esModoOscuro
    ? t("topbar.actions.switchToLight")
    : t("topbar.actions.switchToDark");
  const Icono = esModoOscuro ? Sun : Moon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={etiqueta}
          onClick={alternarModoTema}
          className={claseBotonIcono("h-10 w-10 bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background")}
        >
          <Icono className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{etiqueta}</TooltipContent>
    </Tooltip>
  );
};
