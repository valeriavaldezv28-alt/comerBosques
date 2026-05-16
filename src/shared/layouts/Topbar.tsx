import { ExternalLink, Loader2, Menu, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/config/routePaths";
import { BotonTema } from "../../features/theme";
import { SelectorIdioma } from "../../features/i18n/components/SelectorIdioma";
import { useAuth } from "../../features/auth";
import { PaymentSearchField } from "../../features/payments/shared/components/PaymentSearchField";
import { useTransactionSearch } from "../../features/payments/shared/hooks/useTransactionSearch";
import {
  getPaymentSearchDateRange,
  getPaymentSearchTermType,
  isValidPaymentSearchTerm,
  isSuccessfulTransactionStatus,
} from "../../features/payments/shared/paymentSearch";
import type { TransactionSearchResultItem } from "../../features/payments/shared/types/transactionSearch";
import { claseBotonIcono } from "../ui/estilosDashboard";
import { formatPaymentDateTimeUtc } from "../utils/paymentDateRange";

type BarraSuperiorProps = {
  isSidebarOpen: boolean;
  onMenuClick: () => void;
};

const TRANSACTION_SEARCH_SIZE = 100;
type TransactionSearchDestination = {
  type: "successful";
  routePath: string;
};

const getTransactionSearchDestination = (status: string): TransactionSearchDestination | null =>
  isSuccessfulTransactionStatus(status)
    ? { type: "successful", routePath: ROUTE_PATHS.successfulPayments }
    : null;

const formatCurrency = (amount: number | null, currency: string, locale: string): string => {
  if (amount === null) {
    return "-";
  }

  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
};

export const BarraSuperior = ({ isSidebarOpen, onMenuClick }: BarraSuperiorProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const isAdmin = user?.role === "admin";
  const isDashboardPage = location.pathname === ROUTE_PATHS.dashboard;
  const userName = user?.correo?.split("@")[0] ?? t("topbar.userFallback");
  const displayName = isAdmin ? `${userName} (${t("topbar.admin.shortLabel")})` : userName;
  const locale = i18n.resolvedLanguage === "es" ? "es-MX" : "en-US";
  const trimmedTransactionSearchTerm = transactionSearchTerm.trim();
  const hasTransactionSearchTerm = trimmedTransactionSearchTerm.length > 0;
  const isTransactionSearchTermValid = isValidPaymentSearchTerm(trimmedTransactionSearchTerm);
  const searchError = hasTransactionSearchTerm && !isTransactionSearchTermValid
    ? t("payments.search.invalidTransactionOrOrderFormat")
    : null;
  const transactionSearchDateRange = useMemo(
    () => (submittedSearchTerm ? getPaymentSearchDateRange(submittedSearchTerm) : null),
    [submittedSearchTerm],
  );
  const submittedSearchTermType = useMemo(
    () => (submittedSearchTerm ? getPaymentSearchTermType(submittedSearchTerm) : null),
    [submittedSearchTerm],
  );
  const transactionSearchQuery = useMemo(
    () => ({
      ...(submittedSearchTermType === "transactionId" ? { transactionId: submittedSearchTerm ?? "" } : {}),
      ...(submittedSearchTermType === "orderId" ? { orderId: submittedSearchTerm ?? "" } : {}),
      from: transactionSearchDateRange?.from ?? "",
      to: transactionSearchDateRange?.to ?? "",
      size: TRANSACTION_SEARCH_SIZE,
    }),
    [submittedSearchTerm, submittedSearchTermType, transactionSearchDateRange],
  );
  const transactionSearchResult = useTransactionSearch(
    transactionSearchQuery,
    Boolean(isSearchModalOpen && submittedSearchTerm && submittedSearchTermType && transactionSearchDateRange),
  );
  const foundTransaction = transactionSearchResult.data?.items[0] ?? null;
  const transactionDestination = foundTransaction ? getTransactionSearchDestination(foundTransaction.status) : null;
  const transactionTypeLabel = transactionDestination ? t("payments.search.modal.types.successful") : "";
  const handleTransactionSearchSubmit = (value: string) => {
    const searchTerm = value.trim();

    if (!searchTerm || !isValidPaymentSearchTerm(searchTerm)) {
      return;
    }

    setSubmittedSearchTerm(searchTerm);
    setIsSearchModalOpen(true);
    setTransactionSearchTerm("");
  };
  const closeSearchModal = () => setIsSearchModalOpen(false);
  const handleViewTransaction = () => {
    if (!submittedSearchTerm || !submittedSearchTermType || !transactionDestination) {
      return;
    }

    navigate({
      pathname: transactionDestination.routePath,
      search: `?${submittedSearchTermType}=${encodeURIComponent(submittedSearchTerm)}`,
    });
    closeSearchModal();
  };

  return (
    <header className="m-3 flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-4 shadow-[0_14px_34px_hsl(var(--foreground)/0.05)] lg:m-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-controls="dashboard-sidebar-mobile"
        aria-expanded={isSidebarOpen}
        aria-label={isSidebarOpen ? t("topbar.actions.closeSidebar") : t("topbar.actions.openSidebar")}
        className={claseBotonIcono("h-10 w-10 bg-muted lg:hidden")}
      >
        {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {isDashboardPage ? (
        <PaymentSearchField
          value={transactionSearchTerm}
          onChange={setTransactionSearchTerm}
          onSubmit={handleTransactionSearchSubmit}
          error={searchError}
          placeholder={t("payments.search.topbarPlaceholder")}
          showLabel={false}
          className="flex min-w-64 flex-1 flex-col gap-1 lg:max-w-md"
        />
      ) : (
        <div className="flex-1" />
      )}

      <SelectorIdioma />
      <BotonTema />

      <div className="flex items-center gap-3 border-l border-border/70 pl-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
          isAdmin ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
        }`}>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <p className="text-[11px] text-muted-foreground">{isAdmin ? t("topbar.admin.role") : t("topbar.client.role")}</p>
        </div>
      </div>
      {isSearchModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm" role="presentation" onMouseDown={closeSearchModal}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-search-modal-title"
            className="w-full max-w-xl rounded-lg border border-border bg-card p-5 text-card-foreground shadow-[0_24px_70px_hsl(var(--foreground)/0.18)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t("payments.search.modal.eyebrow")}</p>
                <h2 id="transaction-search-modal-title" className="mt-1 text-xl font-bold text-foreground">
                  {t("payments.search.modal.title")}
                </h2>
              </div>
              <button type="button" onClick={closeSearchModal} aria-label={t("common.actions.close")} className={claseBotonIcono("h-9 w-9 bg-secondary")}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {transactionSearchResult.isLoading || transactionSearchResult.isFetching ? (
              <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-background/60 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t("payments.search.modal.loading")}
              </div>
            ) : transactionSearchResult.isError ? (
              <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {t("payments.search.error")}
              </div>
            ) : foundTransaction && transactionDestination ? (
              <TransactionSearchSummary
                transaction={foundTransaction}
                typeLabel={transactionTypeLabel}
                locale={locale}
                onViewTransaction={handleViewTransaction}
              />
            ) : (
              <div className="rounded-lg border border-border bg-background/60 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-foreground">{t("payments.search.modal.emptyTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("payments.search.empty")}</p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </header>
  );
};

type TransactionSearchSummaryProps = {
  transaction: TransactionSearchResultItem;
  typeLabel: string;
  locale: string;
  onViewTransaction: () => void;
};

const TransactionSearchSummary = ({
  transaction,
  typeLabel,
  locale,
  onViewTransaction,
}: TransactionSearchSummaryProps) => {
  const { t } = useTranslation();
  const detailItems = [
    { label: t("payments.search.modal.fields.transaction"), value: transaction.transactionId },
    { label: t("payments.search.modal.fields.order"), value: transaction.orderId },
    { label: t("payments.search.modal.fields.status"), value: transaction.status },
    { label: t("payments.search.modal.fields.createdAt"), value: formatPaymentDateTimeUtc(transaction.createdAt, locale) },
    { label: t("payments.search.modal.fields.card"), value: `${transaction.cardBrand} ${transaction.lastFourDigits !== "-" ? `**** ${transaction.lastFourDigits}` : transaction.cardNumberMask}` },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-background/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("payments.search.modal.fields.type")}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{typeLabel}</p>
          </div>
          <div className="rounded-lg bg-success/10 px-4 py-2 text-right">
            <p className="text-xs font-semibold text-success">{t("payments.search.modal.fields.amount")}</p>
            <p className="text-xl font-bold text-success">{formatCurrency(transaction.amount, transaction.currency, locale)}</p>
          </div>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        {detailItems.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-background px-3 py-2">
            <dt className="text-xs font-semibold text-muted-foreground">{item.label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-foreground">{item.value || "-"}</dd>
          </div>
        ))}
      </dl>

      {transaction.description && transaction.description !== "-" ? (
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground">{t("payments.search.modal.fields.description")}</p>
          <p className="mt-1 text-sm text-foreground">{transaction.description}</p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button type="button" onClick={onViewTransaction} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
          <ExternalLink className="h-4 w-4" />
          {t("payments.search.modal.viewDetails")}
        </button>
      </div>
    </div>
  );
};
