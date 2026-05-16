import { useMemo } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { obtenerConfigDashboard } from "../config/dashboardConfig";

export const useDashboard = () => {
  const { user } = useAuth();

  return useMemo(() => {
    const role = user?.role ?? "client";
    return obtenerConfigDashboard(role);
  }, [user?.role]);
};