import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  ImagePlus,
  PackageCheck,
  Plus,
  Search,
  X,
} from "lucide-react";
import { claseBotonPrimario, claseTarjeta } from "@/shared/ui/estilosDashboard";

type InventoryStatus = "Activo" | "Bajo stock" | "Agotado";

type InventoryProduct = {
  id: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  supplier: string;
  unit: string;
  warehouse: string;
  minStock: number;
  averageCost: number;
  salePrice: number;
  imageUrl: string;
  stockTotal: number;
  available: number;
  lastMovement?: string;
};

type ProductForm = Omit<InventoryProduct, "stockTotal" | "available" | "lastMovement">;

const emptyProductForm: ProductForm = {
  id: "",
  barcode: "",
  name: "",
  category: "",
  brand: "",
  supplier: "",
  unit: "",
  warehouse: "",
  minStock: 0,
  averageCost: 0,
  salePrice: 0,
  imageUrl: "",
};

const quickFilters = ["Categoria", "Marca", "Proveedor", "Almacen", "Estatus", "Nivel de stock"];

const formFields = [
  { name: "imageUrl", label: "Imagen del producto", placeholder: "URL de imagen" },
  { name: "id", label: "ID / Codigo", placeholder: "AB-1001" },
  { name: "barcode", label: "Codigo de barras", placeholder: "7501023501128" },
  { name: "name", label: "Nombre del producto", placeholder: "Aceite vegetal 1 L" },
  { name: "category", label: "Categoria", placeholder: "Aceites" },
  { name: "brand", label: "Marca", placeholder: "Marca comercial" },
  { name: "supplier", label: "Proveedor", placeholder: "Proveedor principal" },
  { name: "unit", label: "Unidad de medida", placeholder: "Caja, pieza, kg" },
  { name: "warehouse", label: "Almacen", placeholder: "Almacen central" },
] satisfies Array<{ name: keyof ProductForm; label: string; placeholder: string }>;

const numericFields = [
  { name: "minStock", label: "Stock minimo", placeholder: "24" },
  { name: "averageCost", label: "Costo promedio", placeholder: "28.40" },
  { name: "salePrice", label: "Precio venta", placeholder: "38.90" },
] satisfies Array<{ name: keyof ProductForm; label: string; placeholder: string }>;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);

const getStatus = (product: InventoryProduct): InventoryStatus => {
  if (product.available <= 0) {
    return "Agotado";
  }

  if (product.available <= product.minStock) {
    return "Bajo stock";
  }

  return "Activo";
};

const getStatusClassName = (status: InventoryStatus) => {
  if (status === "Activo") {
    return "bg-success/10 text-success ring-success/25";
  }

  if (status === "Bajo stock") {
    return "bg-amber-100 text-amber-800 ring-amber-300/70 dark:bg-amber-400/15 dark:text-amber-200";
  }

  return "bg-destructive/10 text-destructive ring-destructive/25";
};

export default function DashboardView() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [entryProductId, setEntryProductId] = useState<string | null>(null);
  const [entryQuantity, setEntryQuantity] = useState("");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) =>
      [product.id, product.barcode, product.name, product.category, product.brand, product.supplier]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [products, searchTerm]);

  const activeProducts = products.filter((product) => getStatus(product) === "Activo").length;
  const lowStockProducts = products.filter((product) => getStatus(product) === "Bajo stock").length;
  const soldOutProducts = products.filter((product) => getStatus(product) === "Agotado").length;
  const inventoryValue = products.reduce(
    (total, product) => total + product.stockTotal * product.averageCost,
    0,
  );
  const entryProduct = products.find((product) => product.id === entryProductId) ?? null;

  const updateProductForm = (field: keyof ProductForm, value: string) => {
    setProductForm((currentForm) => ({
      ...currentForm,
      [field]: ["minStock", "averageCost", "salePrice"].includes(field)
        ? Number(value)
        : value,
    }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setIsProductFormOpen(false);
  };

  const handleCreateProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setProducts((currentProducts) => [
      {
        ...productForm,
        stockTotal: 0,
        available: 0,
        lastMovement: "Producto creado sin stock inicial",
      },
      ...currentProducts,
    ]);

    resetProductForm();
  };

  const handleEntrySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quantity = Number(entryQuantity);

    if (!entryProductId || Number.isNaN(quantity) || quantity <= 0) {
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === entryProductId
          ? {
              ...product,
              stockTotal: product.stockTotal + quantity,
              available: product.available + quantity,
              lastMovement: `Entrada registrada por ${quantity} ${product.unit || "unidades"}`,
            }
          : product,
      ),
    );

    setEntryProductId(null);
    setEntryQuantity("");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
      <section className={claseTarjeta("p-4 sm:p-5")}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Inventario operativo
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
              Productos, entradas y stock actualizado automaticamente
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              El alta define el producto. El stock se mueve por entradas, salidas, traspasos y ajustes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsProductFormOpen(true)}
            className={claseBotonPrimario("h-12 gap-2 px-5 text-sm")}
          >
            <Plus className="h-5 w-5" />
            Nuevo producto
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {[
            "Agregar producto",
            "Buscar producto",
            "Entrada de producto",
            "Stock automatico",
          ].map((step, index) => (
            <div key={step} className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="text-sm font-medium text-foreground">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Valor total del inventario", value: formatCurrency(inventoryValue), icon: CircleDollarSign },
          { label: "Productos activos", value: String(activeProducts), icon: PackageCheck },
          { label: "Bajo stock", value: String(lowStockProducts), icon: Boxes },
          { label: "Agotados", value: String(soldOutProducts), icon: ClipboardList },
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <article key={metric.label} className={claseTarjeta("p-4")}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{metric.value}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className={claseTarjeta("overflow-hidden")}>
        <div className="border-b border-border/70 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Inventario principal</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Busca por ID, SKU, codigo de barras o nombre del producto.
              </p>
            </div>
            <div className="relative w-full xl:max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Buscar en inventario"
                placeholder="Buscar producto..."
                className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {quickFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px] border-collapse text-left">
            <thead className="bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {[
                  "Imagen",
                  "ID / Codigo",
                  "Codigo de barras",
                  "Nombre del producto",
                  "Categoria",
                  "Stock total",
                  "Disponible",
                  "Costo promedio",
                  "Precio venta",
                  "Estatus",
                  "Acciones",
                ].map((heading) => (
                  <th key={heading} className="whitespace-nowrap px-4 py-3 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {filteredProducts.map((product) => {
                const status = getStatus(product);

                return (
                  <tr key={product.id} className="bg-card transition hover:bg-muted/30">
                    <td className="px-4 py-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <ImagePlus className="h-5 w-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{product.id}</p>
                      <p className="text-xs text-muted-foreground">SKU-{product.id}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-muted-foreground">
                      {product.barcode}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.brand || "Sin marca"}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {product.category}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-foreground">
                      {product.stockTotal}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-foreground">
                      {product.available}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {formatCurrency(product.averageCost)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-foreground">
                      {formatCurrency(product.salePrice)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClassName(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEntryProductId(product.id)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-muted"
                        >
                          <ArrowDownToLine className="h-4 w-4" />
                          Entrada
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                        >
                          Kardex
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Boxes className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">Inventario sin productos</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Agrega el primer producto al catalogo. El stock se mantendra en cero hasta registrar una entrada.
            </p>
            <button
              type="button"
              onClick={() => setIsProductFormOpen(true)}
              className={claseBotonPrimario("mt-5 h-11 gap-2 px-4 text-sm")}
            >
              <Plus className="h-4 w-4" />
              Nuevo producto
            </button>
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <article className={claseTarjeta("p-5")}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Ventas del dia</h3>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-4 text-3xl font-semibold text-foreground">$0.00</p>
          <p className="mt-1 text-sm text-muted-foreground">Se alimenta desde ventas registradas.</p>
        </article>

        <article className={claseTarjeta("p-5")}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Productos mas vendidos</h3>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-5 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
            Sin datos de venta todavia.
          </div>
        </article>

        <article className={claseTarjeta("p-5")}>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Ventas por categoria</h3>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-5 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
            Se mostrara cuando existan movimientos.
          </div>
        </article>
      </section>

      <section className={claseTarjeta("p-5")}>
        <h3 className="text-base font-semibold text-foreground">Flujo de entrada de productos</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[
            "Compra genera orden",
            "Llega mercancia",
            "Almacen recibe",
            "Captura cantidades",
            "Kardex automatico",
          ].map((step, index) => (
            <div key={step} className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <p className="text-xs font-semibold text-primary">Paso {index + 1}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {isProductFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/55">
          <form
            onSubmit={handleCreateProduct}
            className="flex h-full w-full max-w-2xl flex-col bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Nuevo producto</h3>
                <p className="text-sm text-muted-foreground">El stock inicial queda en cero.</p>
              </div>
              <button
                type="button"
                onClick={resetProductForm}
                aria-label="Cerrar formulario"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-4 md:grid-cols-2">
                {formFields.map((field) => (
                  <label key={field.name} className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>{field.label}</span>
                    <input
                      required={field.name !== "imageUrl"}
                      value={String(productForm[field.name])}
                      onChange={(event) => updateProductForm(field.name, event.target.value)}
                      placeholder={field.placeholder}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>
                ))}

                {numericFields.map((field) => (
                  <label key={field.name} className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>{field.label}</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={Number(productForm[field.name]) || ""}
                      onChange={(event) => updateProductForm(field.name, event.target.value)}
                      placeholder={field.placeholder}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                El stock no se captura aqui. Se actualiza por entradas, salidas, traspasos o ajustes
                para conservar trazabilidad y kardex.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border p-5">
              <button
                type="button"
                onClick={resetProductForm}
                className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Cancelar
              </button>
              <button type="submit" className={claseBotonPrimario("h-10 gap-2 px-4 text-sm")}>
                <Plus className="h-4 w-4" />
                Guardar producto
              </button>
            </div>
          </form>
        </div>
      )}

      {entryProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <form onSubmit={handleEntrySubmit} className={claseTarjeta("w-full max-w-md p-5")}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Entrada de producto</h3>
                <p className="mt-1 text-sm text-muted-foreground">{entryProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEntryProductId(null)}
                aria-label="Cerrar entrada"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Flujo esperado: buscar orden de compra, cargar productos esperados, capturar cantidades
              recibidas, validar diferencias, actualizar stock y generar kardex.
            </div>

            <label className="mt-5 block space-y-1.5 text-sm font-medium text-foreground">
              <span>Cantidad recibida</span>
              <input
                required
                type="number"
                min="1"
                value={entryQuantity}
                onChange={(event) => setEntryQuantity(event.target.value)}
                placeholder="0"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
              />
            </label>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEntryProductId(null)}
                className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Cancelar
              </button>
              <button type="submit" className={claseBotonPrimario("h-10 gap-2 px-4 text-sm")}>
                <ArrowDownToLine className="h-4 w-4" />
                Actualizar stock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
