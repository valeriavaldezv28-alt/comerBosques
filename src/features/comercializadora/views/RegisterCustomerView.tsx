import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, MapPin, MessageCircle, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  emptyCustomerFormValues,
  registerCustomer,
  validateCustomerFormValues,
  type CustomerFormValues,
  type CustomerValidationErrors,
} from "@/features/comercializadora/customersApi";
import { CustomerForm } from "@/features/comercializadora/components/CustomerForm";
import { SelectorIdioma } from "@/features/i18n/components/SelectorIdioma";
import { BotonTema } from "@/features/theme";
import { claseTarjeta } from "@/shared/ui/estilosDashboard";

const getErrorCount = (errors: CustomerValidationErrors) => Object.keys(errors).length;

export default function RegisterCustomerView() {
  const { t } = useTranslation();
  const [values, setValues] = useState<CustomerFormValues>(emptyCustomerFormValues);
  const [errors, setErrors] = useState<CustomerValidationErrors>({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const errorCount = useMemo(() => getErrorCount(errors), [errors]);

  const handleValuesChange = (nextValues: CustomerFormValues) => {
    setValues(nextValues);
    setErrors({});
    setServerError("");
    setIsSuccess(false);
  };

  const handleSubmit = async () => {
    const nextErrors = validateCustomerFormValues(values, { requireTerms: true });

    if (getErrorCount(nextErrors) > 0) {
      setErrors(nextErrors);
      setIsSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setServerError("");

    try {
      await registerCustomer(values);
      setIsSuccess(true);
      setValues(emptyCustomerFormValues);
      setErrors({});
    } catch (error) {
      setIsSuccess(false);
      setServerError(
        error instanceof Error
          ? error.message
          : "No pudimos crear el registro. / We could not create the registration.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-card/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("customerRegistration.header.eyebrow")}
              </p>
              <h1 className="text-lg font-semibold text-foreground">
                {t("customerRegistration.header.title")}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SelectorIdioma />
            <BotonTema />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-6 lg:py-8">
        <section className="space-y-4">
          <div className={claseTarjeta("p-5")}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              {t("customerRegistration.intro.title")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("customerRegistration.intro.description")}
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-dashboard-soft p-5">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t("customerRegistration.flow.title")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("customerRegistration.flow.description")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={claseTarjeta("p-5")}>
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {t("customerRegistration.form.title")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("customerRegistration.form.requiredNote")}
              </p>
            </div>

            {isSuccess && (
              <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">
                      Registro creado correctamente. Ya puedes realizar pedidos por WhatsApp.
                    </p>
                    <p className="mt-1">
                      Registration created successfully. You can now place orders through WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(serverError || errorCount > 0) && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <div>
                    {serverError ? (
                      <p className="font-medium">{serverError}</p>
                    ) : (
                      <p className="font-medium">
                        Revisa los campos marcados. / Please review the highlighted fields.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <CustomerForm
              values={values}
              errors={errors}
              isSubmitting={isSubmitting}
              onChange={handleValuesChange}
              onSubmit={() => void handleSubmit()}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
