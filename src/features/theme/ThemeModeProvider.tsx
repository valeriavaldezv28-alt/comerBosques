import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ContextoModoTema, type ValorContextoModoTema } from "./themeModeContext";
import { servicioTema, type ModoTema } from "./themeService";

export const ProveedorModoTema = ({ children }: { children: ReactNode }) => {
  const [modoTema, setModoTema] = useState<ModoTema>(() => servicioTema.obtenerModoTemaInicial());

  useEffect(() => {
    servicioTema.aplicarModoTema(modoTema);
  }, [modoTema]);

  const valor = useMemo<ValorContextoModoTema>(
    () => ({
      modoTema,
      esModoOscuro: modoTema === "dark",
      alternarModoTema: () => setModoTema((modoTemaActual) => servicioTema.obtenerSiguienteModoTema(modoTemaActual)),
    }),
    [modoTema],
  );

  return <ContextoModoTema.Provider value={valor}>{children}</ContextoModoTema.Provider>;
};
