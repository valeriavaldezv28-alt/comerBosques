import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppFooter } from "@/shared/layouts/AppFooter";
import { claseTarjeta } from "@/shared/ui/estilosDashboard";

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className={claseTarjeta("max-w-md p-8 text-center")}>
        <h1 className="mb-3 text-4xl font-bold text-foreground">{t("notFound.title")}</h1>
        <p className="mb-5 text-sm text-muted-foreground">{t("notFound.description")}</p>
        <Link to="/" className="text-sm font-medium text-info underline-offset-4 hover:underline">
          {t("notFound.action")}
        </Link>
      </div>
      <AppFooter className="mt-6" />
    </main>
  );
};

export default NotFound;
