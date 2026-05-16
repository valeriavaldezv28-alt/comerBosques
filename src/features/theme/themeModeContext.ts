import { createContext } from "react";
import type { ModoTema } from "./themeService";

export interface ValorContextoModoTema {
  modoTema: ModoTema;
  esModoOscuro: boolean;
  alternarModoTema: () => void;
}

export const ContextoModoTema = createContext<ValorContextoModoTema | null>(null);
