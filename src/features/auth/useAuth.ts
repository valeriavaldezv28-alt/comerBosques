import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "./store/authStore";
import {
  servicioAutenticacion,
  type CredencialesAutenticacion,
} from "./authService";

export const useAuth = () => {
  const { t } = useTranslation();
  const sesion = useAuthStore((s) => s.sesion);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const setSesion = useAuthStore((s) => s.setSesion);
  const clearSesion = useAuthStore((s) => s.clearSesion);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      setIsCheckingAuth(true);

      const sesionBackend = await servicioAutenticacion.obtenerSesion();

      if (sesionBackend) {
        setSesion(sesionBackend);
      } else {
        clearSesion();
      }
    } catch {
      clearSesion();
    } finally {
      setIsCheckingAuth(false);
    }
  }, [setSesion, clearSesion]);

  useEffect(() => {
    if (isHydrated) {
      refreshSession();
    }
  }, [isHydrated, refreshSession]);

  const signIn = useCallback(
    async (credenciales: CredencialesAutenticacion) => {
      const nuevaSesion =
        await servicioAutenticacion.iniciarSesion(credenciales, t);

      setSesion(nuevaSesion);
      return nuevaSesion;
    },
    [setSesion, t]
  );

  const signOut = useCallback(async () => {
    await servicioAutenticacion.cerrarSesion();
    clearSesion();
  }, [clearSesion]);

  return {
    sesion,
    user: sesion?.usuario ?? null,
    isAuthenticated: Boolean(sesion),
    isHydrated,
    isCheckingAuth, //  CLAVE
    signIn,
    signOut,
    refreshSession,
  };
};