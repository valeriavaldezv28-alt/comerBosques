import { cn } from "../../lib/utils";

export const claseTarjeta = (clasesExtra?: string): string =>
  cn("overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm", clasesExtra);

export const claseTarjetaSuave = (clasesExtra?: string): string =>
  cn("rounded-xl border border-slate-100 bg-slate-50", clasesExtra);

export const claseBotonIcono = (clasesExtra?: string): string =>
  cn(
    "flex items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900",
    clasesExtra,
  );

export const claseBotonPrimario = (clasesExtra?: string): string =>
  cn(
    "inline-flex items-center justify-center rounded-md bg-blue-600 font-semibold text-white shadow-sm transition hover:bg-blue-700",
    clasesExtra,
  );
