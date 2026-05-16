/**
 * Hook para verificar permisos en componentes
 * Uso: const { tienePermiso, tienePermisos } = usePermissions();
 */

import { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import { tienePermiso as checkPermiso, tienePermisos as checkPermisos, type Permiso } from "./permissions";

export const usePermissions = () => {
  const { user } = useAuth();

  const rol = useMemo(() => user?.role, [user?.role]);

  const tienePermiso = useCallback(
    (permiso: Permiso): boolean => {
      if (!rol) {
        return false;
      }

      return checkPermiso(rol, permiso);
    },
    [rol],
  );

  const tienePermisos = useCallback(
    (permisos: Permiso[]): boolean => {
      if (!rol) {
        return false;
      }

      return checkPermisos(rol, permisos);
    },
    [rol],
  );

  return {
    tienePermiso,
    tienePermisos,
  };
};
