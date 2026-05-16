import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth";
import { ROUTE_PATHS } from "@/config/routePaths";

const IndexPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          <span className="text-sm">{t("common.loading.session")}</span>
        </div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? ROUTE_PATHS.dashboard : ROUTE_PATHS.login} replace />;
};

export default IndexPage;
