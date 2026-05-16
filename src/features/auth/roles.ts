/**
 * Definición centralizada de roles del sistema
 * Este archivo es la fuente única de verdad para roles y sus descripciones
 */

export type RolUsuario = "admin" | "client";

export const ROLES = {
  ADMIN: "admin" as const,
  CLIENT: "client" as const,
} as const;

export const ROLE_LABELS: Record<RolUsuario, string> = {
  admin: "Administrador",
  client: "Cliente",
};

export const ROLE_DESCRIPTIONS: Record<RolUsuario, string> = {
  admin: "Acceso administrativo completo al sistema PSP",
  client: "Acceso como comercio cliente",
};
