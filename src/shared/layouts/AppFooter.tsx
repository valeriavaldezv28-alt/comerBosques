import { useTranslation } from "react-i18next";

type AppFooterProps = {
  className?: string;
  withDivider?: boolean;
};

export const AppFooter = ({
  className = "",
  withDivider = true,
}: AppFooterProps) => {
  const { t } = useTranslation();

  return (
    <footer className={`${withDivider ? "border-t border-border/70 pt-4" : ""} text-center ${className}`}>
      <div className="mx-auto w-full max-w-6xl text-xs font-semibold tracking-wide text-muted-foreground">
        {t("brand.footer")}
      </div>
    </footer>
  );
};
