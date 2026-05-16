import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ROUTE_PATHS } from "@/config/routePaths";
import type { RolUsuario } from "./roles";
import { useAuth } from "./useAuth";

interface RutaProtegidaProps {
  children: ReactNode;
  allowedRoles?: RolUsuario[];
}

export const RutaProtegida = ({
  children,
  allowedRoles,
}: RutaProtegidaProps) => {
  const ubicacion = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, user, isHydrated, isCheckingAuth } = useAuth();

  //  1. Esperar estado global + validación backend
  if (!isHydrated || isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        {t("common.loading.session")}
      </div>
    );
  }

  //  2. No autenticado
  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTE_PATHS.login}
        replace
        state={{ from: ubicacion.pathname }}
      />
    );
  }

  //  3. Sin permisos
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTE_PATHS.dashboard} replace />;
  }

  return <>{children}</>;
};
