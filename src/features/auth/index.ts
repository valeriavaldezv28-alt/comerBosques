/**
 * Exports públicos del feature de Auth
 * Esta es la interfaz para consumidores externos
 */

export * from "./roles";
export * from "./permissions";
export { useAuth } from "./useAuth";
export { usePermissions } from "./usePermissions";
export { RutaProtegida } from "./ProtectedRoute";
export { SessionInactivityTimeout } from "./SessionInactivityTimeout";
export { servicioAutenticacion } from "./authService";
