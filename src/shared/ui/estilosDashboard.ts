import { cn } from "../../lib/utils";

export const claseTarjeta = (clasesExtra?: string): string =>
  cn("dashboard-card", clasesExtra);

export const claseTarjetaSuave = (clasesExtra?: string): string =>
  cn("dashboard-card-soft", clasesExtra);

export const claseBotonIcono = (clasesExtra?: string): string =>
  cn(
    "flex items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground",
    clasesExtra,
  );

export const claseBotonPrimario = (clasesExtra?: string): string =>
  cn(
    "inline-flex items-center justify-center rounded-lg bg-primary font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:brightness-105",
    clasesExtra,
  );
