import { cn } from "../../lib/utils";
import type { TonoBarraAnalitica, TonoSemantico, VarianteMetrica } from "../../features/dashboard/data";

const clasesTarjeta = {
  base: "dashboard-card",
  suave: "dashboard-card-soft",
  invertida: "dashboard-card-inverted",
} as const;

const clasesTono: Record<TonoSemantico, string> = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-secondary text-muted-foreground",
};

const clasesAvatar: Record<TonoSemantico, string> = {
  info: "bg-info",
  success: "bg-success",
  destructive: "bg-destructive",
  muted: "bg-secondary",
};

const clasesBarra: Record<TonoBarraAnalitica, string> = {
  rayado: "bg-secondary bg-dashboard-stripes",
  success: "bg-success",
  invertida: "bg-dashboard-inverted",
  suave: "bg-dashboard-soft",
};

export const claseTarjeta = (variante: VarianteMetrica | "base" = "base", clasesExtra?: string): string =>
  cn(clasesTarjeta[variante], clasesExtra);

export const claseTarjetaInvertida = (clasesExtra?: string): string => cn(clasesTarjeta.invertida, clasesExtra);

export const claseTonoSuave = (tono: TonoSemantico, clasesExtra?: string): string => cn(clasesTono[tono], clasesExtra);

export const claseAvatarTono = (tono: TonoSemantico, clasesExtra?: string): string => cn(clasesAvatar[tono], clasesExtra);

export const claseBarraAnalitica = (tono: TonoBarraAnalitica, clasesExtra?: string): string =>
  cn(clasesBarra[tono], clasesExtra);

export const claseBotonIcono = (clasesExtra?: string): string =>
  cn(
    "flex items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground",
    clasesExtra,
  );

export const claseBotonPrimario = (clasesExtra?: string): string =>
  cn(
    "flex items-center justify-center rounded-full bg-primary font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:brightness-105",
    clasesExtra,
  );
