import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { CustomerForm } from "@/features/comercializadora/components/CustomerForm";
import {
  createCustomer,
  deleteCustomer,
  emptyCustomerFormValues,
  fetchCustomers,
  getCustomerAddressLine,
  mapCustomerToFormValues,
  updateCustomer,
  validateCustomerFormValues,
  type CustomerFormValues,
  type CustomerValidationErrors,
  type RegisteredCustomer,
} from "@/features/comercializadora/customersApi";
import { claseBotonPrimario, claseTarjeta, claseTarjetaSuave } from "@/shared/ui/estilosDashboard";

type FormMode = "create" | "edit";
type CustomerStatusMessage = { type: "success" | "error"; text: string } | null;

const getErrorCount = (errors: CustomerValidationErrors) => Object.keys(errors).length;

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const normalizeForSearch = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getStatusLabel = (status?: RegisteredCustomer["status"]) => {
  const normalizedStatus = String(status ?? "active").toLowerCase();

  if (normalizedStatus === "inactive" || normalizedStatus === "inactivo") {
    return "Inactivo";
  }

  return "Activo";
};

export default function CustomersAdminView() {
  const [customers, setCustomers] = useState<RegisteredCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [merchantFilter, setMerchantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState<CustomerStatusMessage>(null);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [formValues, setFormValues] = useState<CustomerFormValues>({
    ...emptyCustomerFormValues,
    termsAccepted: true,
  });
  const [formErrors, setFormErrors] = useState<CustomerValidationErrors>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<RegisteredCustomer | null>(null);

  const loadCustomers = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const nextCustomers = await fetchCustomers();
      setCustomers(
        [...nextCustomers].sort(
          (firstCustomer, secondCustomer) =>
            new Date(secondCustomer.createdAt).getTime() - new Date(firstCustomer.createdAt).getTime(),
        ),
      );
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No pudimos cargar los clientes registrados.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  const merchants = useMemo(
    () => Array.from(new Set(customers.map((customer) => customer.merchantKey).filter(Boolean))).sort(),
    [customers],
  );

  const statuses = useMemo(
    () => Array.from(new Set(customers.map((customer) => getStatusLabel(customer.status)))).sort(),
    [customers],
  );

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = normalizeForSearch(searchQuery.trim());

    return customers.filter((customer) => {
      const matchesSearch =
        !normalizedQuery ||
        normalizeForSearch(customer.fullName).includes(normalizedQuery) ||
        normalizeForSearch(customer.phone).includes(normalizedQuery) ||
        normalizeForSearch(customer.address.city).includes(normalizedQuery);
      const matchesMerchant = merchantFilter === "all" || customer.merchantKey === merchantFilter;
      const matchesStatus = statusFilter === "all" || getStatusLabel(customer.status) === statusFilter;

      return matchesSearch && matchesMerchant && matchesStatus;
    });
  }, [customers, merchantFilter, searchQuery, statusFilter]);

  const openCreateForm = () => {
    setFormMode("create");
    setFormValues({ ...emptyCustomerFormValues, termsAccepted: true });
    setFormErrors({});
    setEditingCustomerId(null);
    setIsFormOpen(true);
    setMessage(null);
  };

  const openEditForm = (customer: RegisteredCustomer) => {
    setFormMode("edit");
    setFormValues({ ...mapCustomerToFormValues(customer), termsAccepted: true });
    setFormErrors({});
    setEditingCustomerId(customer.id);
    setIsFormOpen(true);
    setMessage(null);
  };

  const closeForm = () => {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setEditingCustomerId(null);
    setFormErrors({});
  };

  const handleSubmit = async () => {
    const nextErrors = validateCustomerFormValues(formValues, { requireTerms: false });

    if (getErrorCount(nextErrors) > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      if (formMode === "edit" && editingCustomerId) {
        await updateCustomer(editingCustomerId, { ...formValues, termsAccepted: true });
        setMessage({ type: "success", text: "Cliente actualizado correctamente." });
      } else {
        await createCustomer({ ...formValues, termsAccepted: true });
        setMessage({ type: "success", text: "Cliente creado correctamente." });
      }

      setIsFormOpen(false);
      setEditingCustomerId(null);
      await loadCustomers();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No pudimos guardar el cliente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);

    try {
      await deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
      setMessage({ type: "success", text: "Cliente eliminado correctamente." });
      await loadCustomers();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No pudimos eliminar el cliente.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className={claseTarjeta("overflow-hidden")}>
        <div className="flex flex-col gap-4 border-b border-border/70 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UsersRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Administracion
              </p>
              <h1 className="text-2xl font-semibold text-foreground">Merchan</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Consulta y administra clientes registrados desde WhatsApp y el registro publico.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className={claseBotonPrimario("h-10 gap-2 px-4 text-sm")}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar cliente
          </button>
        </div>

        <div className="grid gap-3 border-b border-border/70 p-4 lg:grid-cols-[1fr_220px_180px]">
          <label className="relative">
            <span className="sr-only">Buscar por nombre, telefono o ciudad</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por nombre, telefono o ciudad"
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
            />
          </label>

          <select
            value={merchantFilter}
            onChange={(event) => setMerchantFilter(event.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
          >
            <option value="all">Todos los merchants</option>
            {merchants.map((merchant) => (
              <option key={merchant} value={merchant}>
                {merchant}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
          >
            <option value="all">Todos los estados</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div className="p-4">
            <div
              className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                message.type === "success"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 p-8 text-sm font-medium text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            Cargando clientes...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="min-h-64 p-8">
            <div className={claseTarjetaSuave("mx-auto max-w-md p-6 text-center")}>
              <UsersRound className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-semibold text-foreground">No hay clientes para mostrar</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Cuando existan registros en el backend apareceran aqui. Puedes crear uno manualmente desde el dashboard.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className={claseBotonPrimario("mt-4 h-10 gap-2 px-4 text-sm")}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Agregar cliente
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1160px] w-full border-collapse text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nombre completo</th>
                  <th className="px-4 py-3 font-semibold">Telefono WhatsApp</th>
                  <th className="px-4 py-3 font-semibold">Merchant</th>
                  <th className="px-4 py-3 font-semibold">Direccion principal</th>
                  <th className="px-4 py-3 font-semibold">Ciudad</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">CP</th>
                  <th className="px-4 py-3 font-semibold">Fecha registro</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-muted/30">
                    <td className="px-4 py-4 font-semibold text-foreground">{customer.fullName}</td>
                    <td className="px-4 py-4 text-muted-foreground">{customer.phone}</td>
                    <td className="px-4 py-4 text-muted-foreground">{customer.merchantKey}</td>
                    <td className="max-w-[260px] px-4 py-4 text-muted-foreground">
                      <span className="line-clamp-2">{getCustomerAddressLine(customer.address)}</span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{customer.address.city}</td>
                    <td className="px-4 py-4 text-muted-foreground">{customer.address.state}</td>
                    <td className="px-4 py-4 text-muted-foreground">{customer.address.postalCode}</td>
                    <td className="px-4 py-4 text-muted-foreground">{formatDate(customer.createdAt)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                          getStatusLabel(customer.status) === "Activo"
                            ? "bg-success/10 text-success ring-success/25"
                            : "bg-muted text-muted-foreground ring-border"
                        }`}
                      >
                        {getStatusLabel(customer.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(customer)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                          aria-label={`Editar ${customer.fullName}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomerToDelete(customer)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-destructive/40 hover:text-destructive"
                          aria-label={`Eliminar ${customer.fullName}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-3 sm:p-6">
          <section className="my-4 w-full max-w-3xl rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {formMode === "edit" ? "Editar cliente" : "Nuevo cliente"}
                </p>
                <h2 className="text-lg font-semibold text-foreground">
                  {formMode === "edit" ? "Actualizar datos del cliente" : "Agregar cliente manualmente"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Cerrar formulario"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="p-4">
              <CustomerForm
                values={formValues}
                errors={formErrors}
                isSubmitting={isSaving}
                showTerms={false}
                submitLabel={formMode === "edit" ? "Guardar cambios" : "Crear cliente"}
                submittingLabel="Guardando..."
                onChange={(nextValues) => {
                  setFormValues(nextValues);
                  setFormErrors({});
                }}
                onSubmit={() => void handleSubmit()}
              />
            </div>
          </section>
        </div>
      )}

      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <section className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Eliminar cliente</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Esta accion eliminara a {customerToDelete.fullName}. Confirma antes de continuar.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeleting}
                className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground transition hover:brightness-105 disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Eliminar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
