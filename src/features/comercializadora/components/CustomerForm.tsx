import { type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  type CustomerFormValues,
  type CustomerValidationErrors,
} from "@/features/comercializadora/customersApi";
import { cn } from "@/lib/utils";
import { claseBotonPrimario } from "@/shared/ui/estilosDashboard";

type TextFieldProps = {
  id: keyof CustomerFormValues | keyof CustomerFormValues["address"];
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "numeric";
  required?: boolean;
  onChange: (value: string) => void;
};

type CustomerFormProps = {
  values: CustomerFormValues;
  errors: CustomerValidationErrors;
  isSubmitting: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  showTerms?: boolean;
  onChange: (values: CustomerFormValues) => void;
  onSubmit: () => void;
};

const TextField = ({
  id,
  label,
  value,
  error,
  placeholder,
  autoComplete,
  inputMode = "text",
  required = true,
  onChange,
}: TextFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-destructive"> *</span>}
    </label>
    <input
      id={id}
      name={id}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      required={required}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground",
        "focus:border-primary focus:ring-2 focus:ring-ring/20",
        error ? "border-destructive" : "border-input",
      )}
    />
    {error && (
      <p id={`${id}-error`} className="text-xs font-medium text-destructive">
        {error}
      </p>
    )}
  </div>
);

export function CustomerForm({
  values,
  errors,
  isSubmitting,
  submitLabel,
  submittingLabel,
  showTerms = true,
  onChange,
  onSubmit,
}: CustomerFormProps) {
  const { t } = useTranslation();

  const updateField = (field: keyof CustomerFormValues, value: string | boolean) => {
    onChange({ ...values, [field]: value });
  };

  const updateAddressField = (field: keyof CustomerFormValues["address"], value: string) => {
    onChange({
      ...values,
      address: { ...values.address, [field]: value },
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="fullName"
          label={t("customerRegistration.form.fields.fullName")}
          value={values.fullName}
          error={errors.fullName}
          autoComplete="name"
          placeholder="Maria Lopez"
          onChange={(value) => updateField("fullName", value)}
        />
        <TextField
          id="phone"
          label={t("customerRegistration.form.fields.phone")}
          value={values.phone}
          error={errors.phone}
          autoComplete="tel"
          inputMode="tel"
          placeholder="+5215512345678"
          onChange={(value) => updateField("phone", value)}
        />
        <div className="sm:col-span-2">
          <TextField
            id="merchantKey"
            label={t("customerRegistration.form.fields.merchantKey")}
            value={values.merchantKey}
            error={errors.merchantKey}
            autoComplete="organization"
            placeholder="comercializadora-bosques"
            onChange={(value) => updateField("merchantKey", value)}
          />
        </div>
      </div>

      <div className="border-t border-border/70 pt-5">
        <h3 className="text-base font-semibold text-foreground">
          {t("customerRegistration.form.addressTitle")}
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            id="street"
            label={t("customerRegistration.form.fields.street")}
            value={values.address.street}
            error={errors.street}
            autoComplete="shipping address-line1"
            onChange={(value) => updateAddressField("street", value)}
          />
          <TextField
            id="number"
            label={t("customerRegistration.form.fields.number")}
            value={values.address.number}
            error={errors.number}
            autoComplete="shipping address-line2"
            onChange={(value) => updateAddressField("number", value)}
          />
          <TextField
            id="neighborhood"
            label={t("customerRegistration.form.fields.neighborhood")}
            value={values.address.neighborhood}
            error={errors.neighborhood}
            onChange={(value) => updateAddressField("neighborhood", value)}
          />
          <TextField
            id="postalCode"
            label={t("customerRegistration.form.fields.postalCode")}
            value={values.address.postalCode}
            error={errors.postalCode}
            autoComplete="shipping postal-code"
            inputMode="numeric"
            onChange={(value) => updateAddressField("postalCode", value)}
          />
          <TextField
            id="city"
            label={t("customerRegistration.form.fields.city")}
            value={values.address.city}
            error={errors.city}
            autoComplete="shipping address-level2"
            onChange={(value) => updateAddressField("city", value)}
          />
          <TextField
            id="state"
            label={t("customerRegistration.form.fields.state")}
            value={values.address.state}
            error={errors.state}
            autoComplete="shipping address-level1"
            onChange={(value) => updateAddressField("state", value)}
          />
          <TextField
            id="country"
            label={t("customerRegistration.form.fields.country")}
            value={values.address.country}
            error={errors.country}
            autoComplete="shipping country-name"
            onChange={(value) => updateAddressField("country", value)}
          />
          <TextField
            id="references"
            label={t("customerRegistration.form.fields.references")}
            value={values.address.references ?? ""}
            error={errors.references}
            required={false}
            onChange={(value) => updateAddressField("references", value)}
          />
        </div>
      </div>

      {showTerms && (
        <div className="space-y-2">
          <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={values.termsAccepted}
              aria-invalid={Boolean(errors.termsAccepted)}
              aria-describedby={errors.termsAccepted ? "termsAccepted-error" : undefined}
              onChange={(event) => updateField("termsAccepted", event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
            />
            <span>{t("customerRegistration.form.fields.termsAccepted")}</span>
          </label>
          {errors.termsAccepted && (
            <p id="termsAccepted-error" className="text-xs font-medium text-destructive">
              {errors.termsAccepted}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className={claseBotonPrimario(
          "h-11 w-full gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto",
        )}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <UserPlus className="h-4 w-4" aria-hidden="true" />
        )}
        {isSubmitting
          ? submittingLabel ?? t("customerRegistration.form.actions.submitting")
          : submitLabel ?? t("customerRegistration.form.actions.submit")}
      </button>
    </form>
  );
}
