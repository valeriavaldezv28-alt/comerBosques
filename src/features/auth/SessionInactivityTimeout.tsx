import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/config/routePaths";
import { ENV } from "@/shared/config/env";
import { servicioAutenticacion } from "./authService";
import { useAuthStore } from "./store/authStore";

const ACTIVITY_EVENTS = [
  "click",
  "keydown",
  "mousedown",
  "mousemove",
  "scroll",
  "touchstart",
] as const;

export const SessionInactivityTimeout = () => {
  const navigate = useNavigate();
  const sesion = useAuthStore((state) => state.sesion);
  const clearSesion = useAuthStore((state) => state.clearSesion);

  useEffect(() => {
    if (!sesion) {
      return undefined;
    }

    let timeoutId: number;

    const cerrarPorInactividad = async () => {
      await servicioAutenticacion.cerrarSesion();
      clearSesion();
      navigate(ROUTE_PATHS.login, { replace: true });
    };

    const reiniciarTimeout = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(
        cerrarPorInactividad,
        ENV.SESSION_INACTIVITY_TIMEOUT_MS,
      );
    };

    reiniciarTimeout();

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, reiniciarTimeout, { passive: true });
    });

    return () => {
      window.clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, reiniciarTimeout);
      });
    };
  }, [clearSesion, navigate, sesion]);

  return null;
};
