import { Search } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

type PaymentSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  className?: string;
  inputClassName?: string;
  showLabel?: boolean;
  onSubmit?: (value: string) => void;
  placeholder?: string;
};

export const PaymentSearchField = ({
  value,
  onChange,
  error,
  className = "flex w-full flex-col gap-2 text-sm font-medium text-foreground sm:w-[20rem]",
  inputClassName = "h-10",
  showLabel = true,
  onSubmit,
  placeholder,
}: PaymentSearchFieldProps) => {
  const { t } = useTranslation();
  const hasError = Boolean(error);
  const labelClassName = showLabel ? "text-muted-foreground" : "sr-only";
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onSubmit?.(value);
    }
  };

  return (
    <label className={className}>
      <span className={labelClassName}>{t("payments.search.label")}</span>
      <span className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t("payments.search.transactionPlaceholder")}
          aria-invalid={hasError}
          className={`${inputClassName} w-full rounded-lg border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 ${hasError ? "border-destructive focus:ring-destructive/30" : "border-input focus:ring-ring/30"}`}
        />
      </span>
      {error ? <span className="text-xs font-medium text-destructive">{error}</span> : null}
    </label>
  );
};
