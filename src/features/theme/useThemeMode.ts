import { useContext } from "react";
import { ContextoModoTema, type ValorContextoModoTema } from "./themeModeContext";

export const useModoTema = (): ValorContextoModoTema => {
  const contexto = useContext(ContextoModoTema);

  if (!contexto) {
    throw new Error("useModoTema debe usarse dentro de ProveedorModoTema");
  }

  return contexto;
};
