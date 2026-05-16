import { ArrowUpRight, Boxes, Building2, PackageCheck, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { claseBotonPrimario, claseTarjeta } from "@/shared/ui/estilosDashboard";

const metricKeys = ["clients", "orders", "inventory"] as const;
const actionKeys = ["catalog", "clients", "reports"] as const;

const metricIcons = {
  clients: Building2,
  orders: PackageCheck,
  inventory: Boxes,
} as const;

export default function DashboardView() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <section className="rounded-lg border border-border/70 bg-card p-6 shadow-[0_18px_44px_hsl(var(--foreground)/0.06)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t("dashboard.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
              {t("dashboard.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("dashboard.description")}
            </p>
          </div>

          <button type="button" className={claseBotonPrimario("h-10 gap-2 px-4 text-sm")}>
            {t("dashboard.actions.primary")}
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {metricKeys.map((key) => {
          const Icon = metricIcons[key];

          return (
            <article key={key} className={claseTarjeta("p-5")}>
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">{t(`dashboard.metrics.${key}.label`)}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {t(`dashboard.metrics.${key}.value`)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(`dashboard.metrics.${key}.helper`)}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <article className={claseTarjeta("p-5")}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{t("dashboard.workspace.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("dashboard.workspace.description")}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {actionKeys.map((key) => (
              <button
                key={key}
                type="button"
                className="rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-muted"
              >
                {t(`dashboard.workspace.actions.${key}`)}
              </button>
            ))}
          </div>
        </article>

        <aside className={claseTarjeta("p-5")}>
          <p className="text-sm font-semibold text-foreground">{t("dashboard.notes.title")}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("dashboard.notes.body")}</p>
        </aside>
      </section>
    </div>
  );
}
