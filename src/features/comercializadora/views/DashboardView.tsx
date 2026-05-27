import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowUpRight,
  Boxes,
  Camera,
  CircleDollarSign,
  ClipboardList,
  FolderUp,
  ImagePlus,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { productsStorageKey } from "@/features/comercializadora/storage";
import { claseBotonPrimario, claseTarjeta } from "@/shared/ui/estilosDashboard";

type InventoryStatus = "agotado" | "poca disponibilidad" | "disponible";

type InventoryProduct = {
  id: string;
  barcode: string;
  name: string;
  category: CategoryOption;
  brand: string;
  unit: UnitOption;
  minStock: number;
  maxStock: number;
  salePrice: number;
  taxRate: number;
  imageUrl: string;
  stockTotal: number;
  available: number;
  lastMovement?: string;
};

type ProductForm = Omit<InventoryProduct, "available" | "lastMovement">;

const categoryOptions = ["Aceites", "Bebidas", "Abarrotes", "Limpieza"] as const;
type CategoryOption = (typeof categoryOptions)[number];

const brandOptions = ["Sin marca", "Nutrioli", "Coca-Cola", "Great Value", "Fabuloso"] as const;
type UnitOption = string;
const unitOptions: UnitOption[] = Array.from({ length: 50 }, (_, index) => String(index + 1));

const categoryStockRules: Record<CategoryOption, { minStock: number; maxStock: number }> = {
  Aceites: { minStock: 24, maxStock: 120 },
  Bebidas: { minStock: 48, maxStock: 240 },
  Abarrotes: { minStock: 30, maxStock: 180 },
  Limpieza: { minStock: 18, maxStock: 90 },
};

const emptyProductForm: ProductForm = {
  id: "",
  barcode: "",
  name: "",
  category: "Aceites",
  brand: "Sin marca",
  unit: "1",
  minStock: categoryStockRules.Aceites.minStock,
  maxStock: categoryStockRules.Aceites.maxStock,
  salePrice: 0,
  taxRate: 16,
  imageUrl: "",
  stockTotal: 0,
};

const quickFilters = ["Categoria", "Marca", "Estatus", "Nivel de stock"];
const barcodeSuggestions: Record<string, Partial<ProductForm>> = {
  "7501023501128": {
    name: "Aceite vegetal 1 L",
    category: "Aceites",
    brand: "Nutrioli",
    unit: "1",
    salePrice: 38.9,
    minStock: 24,
    maxStock: 120,
    taxRate: 16,
  },
  "7501055300072": {
    name: "Refresco cola 600 ml",
    category: "Bebidas",
    brand: "Coca-Cola",
    unit: "1",
    salePrice: 18,
    minStock: 48,
    maxStock: 240,
    taxRate: 16,
  },
  "7501035910017": {
    name: "Limpiador multiusos 1 L",
    category: "Limpieza",
    brand: "Fabuloso",
    unit: "1",
    salePrice: 31,
    minStock: 18,
    maxStock: 90,
    taxRate: 16,
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);

const getStatus = (product: InventoryProduct): InventoryStatus => {
  if (product.stockTotal <= 0) {
    return "agotado";
  }

  if (product.stockTotal < 50) {
    return "poca disponibilidad";
  }

  return "disponible";
};

const getStatusClassName = (status: InventoryStatus) => {
  if (status === "disponible") {
    return "bg-success/10 text-success ring-success/25";
  }

  if (status === "poca disponibilidad") {
    return "bg-amber-100 text-amber-800 ring-amber-300/70 dark:bg-amber-400/15 dark:text-amber-200";
  }

  return "bg-destructive/10 text-destructive ring-destructive/25";
};

const getStockAlert = (status: InventoryStatus) => {
  if (status === "agotado") {
    return "Sin existencias";
  }

  if (status === "poca disponibilidad") {
    return "Stock menor a 50";
  }

  return "Stock suficiente";
};

const getNextProductId = (products: InventoryProduct[]) => {
  const nextNumber =
    products.reduce((highestNumber, product) => {
      const match = /^PROD-(\d+)$/.exec(product.id);
      return match ? Math.max(highestNumber, Number(match[1])) : highestNumber;
    }, 0) + 1;

  return `PROD-${String(nextNumber).padStart(6, "0")}`;
};

const loadStoredProducts = (): InventoryProduct[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedProducts = window.localStorage.getItem(productsStorageKey);
    return storedProducts ? (JSON.parse(storedProducts) as InventoryProduct[]) : [];
  } catch {
    return [];
  }
};

export default function DashboardView() {
  const [products, setProducts] = useState<InventoryProduct[]>(loadStoredProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const nextProductId = useMemo(() => getNextProductId(products), [products]);

  useEffect(() => {
    window.localStorage.setItem(productsStorageKey, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (!isProductFormOpen) {
      return;
    }

    setProductForm((currentForm) => ({
      ...currentForm,
      id: editingProductId ? currentForm.id : currentForm.id || nextProductId,
    }));
    window.setTimeout(() => barcodeInputRef.current?.focus(), 0);
  }, [editingProductId, isProductFormOpen, nextProductId]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) =>
      [product.id, product.barcode, product.name, product.category, product.brand]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [products, searchTerm]);

  const availableProducts = products.filter((product) => getStatus(product) === "disponible").length;
  const lowAvailabilityProducts = products.filter((product) => getStatus(product) === "poca disponibilidad").length;
  const soldOutProducts = products.filter((product) => getStatus(product) === "agotado").length;
  const inventoryValue = products.reduce(
    (total, product) => total + product.stockTotal * product.salePrice,
    0,
  );

  const updateProductForm = (field: keyof ProductForm, value: string) => {
    setProductForm((currentForm) => ({
      ...currentForm,
      [field]: ["minStock", "maxStock", "salePrice", "taxRate", "stockTotal"].includes(field)
        ? Number(value)
        : value,
    }));
  };

  const updateProductCategory = (category: CategoryOption) => {
    const stockRule = categoryStockRules[category];

    setProductForm((currentForm) => ({
      ...currentForm,
      category,
      minStock: stockRule.minStock,
      maxStock: stockRule.maxStock,
    }));
  };

  const suggestProductFromBarcode = () => {
    const barcode = productForm.barcode.trim();

    if (!barcode) {
      return;
    }

    const existingProduct = products.find((product) => product.barcode === barcode);
    const suggestion = existingProduct ?? barcodeSuggestions[barcode];

    if (!suggestion) {
      return;
    }

    setProductForm((currentForm) => ({
      ...currentForm,
      name: suggestion.name ?? currentForm.name,
      category: suggestion.category ?? currentForm.category,
      brand: suggestion.brand ?? currentForm.brand,
      unit: suggestion.unit ?? currentForm.unit,
      salePrice: suggestion.salePrice ?? currentForm.salePrice,
      minStock: suggestion.minStock ?? currentForm.minStock,
      maxStock: suggestion.maxStock ?? currentForm.maxStock,
      taxRate: suggestion.taxRate ?? currentForm.taxRate,
      imageUrl: suggestion.imageUrl ?? currentForm.imageUrl,
    }));
  };

  const handleBarcodeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    suggestProductFromBarcode();
    window.setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const updateProductImage = (file: File | null) => {
    if (!file) {
      return;
    }

    setProductForm((currentForm) => ({
      ...currentForm,
      imageUrl: URL.createObjectURL(file),
    }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setIsProductFormOpen(false);
  };

  const clearProductForm = (nextId = nextProductId) => {
    setProductForm({
      ...emptyProductForm,
      id: nextId,
      category: productForm.category,
      brand: productForm.brand,
      unit: productForm.unit,
      minStock: productForm.minStock,
      maxStock: productForm.maxStock,
    });
    window.setTimeout(() => barcodeInputRef.current?.focus(), 0);
  };

  const openNewProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      ...emptyProductForm,
      id: nextProductId,
    });
    setIsProductFormOpen(true);
  };

  const handleEditProduct = (product: InventoryProduct) => {
    setEditingProductId(product.id);
    setProductForm({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      brand: product.brand,
      unit: product.unit,
      minStock: product.minStock,
      maxStock: product.maxStock,
      salePrice: product.salePrice,
      taxRate: product.taxRate,
      imageUrl: product.imageUrl,
      stockTotal: product.stockTotal,
    });
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    const shouldDelete = window.confirm("Eliminar este producto del inventario?");

    if (!shouldDelete) {
      return;
    }

    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
  };

  const handleCreateProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const shouldContinue = submitter?.value === "continue";

    if (editingProductId) {
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProductId
            ? {
                ...product,
                ...productForm,
                id: editingProductId,
                available: productForm.stockTotal,
              }
            : product,
        ),
      );
      resetProductForm();
      return;
    }

    const createdProductId = getNextProductId(products);
    const nextAvailableId = getNextProductId([
      { ...productForm, id: createdProductId, available: productForm.stockTotal },
      ...products,
    ]);

    setProducts((currentProducts) => {
      const newProductId = getNextProductId(currentProducts);

      return [
        {
          ...productForm,
          id: newProductId,
          available: productForm.stockTotal,
          lastMovement: "Producto creado con stock inicial",
        },
        ...currentProducts,
      ];
    });

    if (shouldContinue) {
      clearProductForm(nextAvailableId);
      return;
    }

    resetProductForm();
  };

  const metrics = [
    { label: "Valor total del inventario", value: formatCurrency(inventoryValue), icon: CircleDollarSign },
    { label: "Disponibles", value: String(availableProducts), icon: PackageCheck },
    { label: "Poca disponibilidad", value: String(lowAvailabilityProducts), icon: Boxes },
    { label: "Agotados", value: String(soldOutProducts), icon: ClipboardList },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5">
      <section className={claseTarjeta("overflow-hidden")}>
        <div className="border-b border-border/70 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Inventario principal</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Busca por ID, SKU, codigo de barras o nombre del producto.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-2xl">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Buscar en inventario"
                  placeholder="Buscar producto..."
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <button
                type="button"
                onClick={openNewProductForm}
                className={claseBotonPrimario("h-11 gap-2 px-4 text-sm")}
              >
                <Plus className="h-4 w-4" />
                Nuevo producto
              </button>
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
          <table className="w-full min-w-[1260px] border-collapse text-left">
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
                  "Min / Max",
                  "Precio venta",
                  "Estatus",
                  "Alerta",
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
                const stockAlert = getStockAlert(status);

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
                      {product.minStock} / {product.maxStock}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-foreground">
                      {formatCurrency(product.salePrice)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClassName(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-muted-foreground">
                      {stockAlert}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditProduct(product)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-sm font-medium text-destructive transition hover:bg-destructive/15"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
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
              Agrega el primer producto al catalogo y captura su stock inicial.
            </p>
            <button
              type="button"
              onClick={openNewProductForm}
              className={claseBotonPrimario("mt-5 h-11 gap-2 px-4 text-sm")}
            >
              <Plus className="h-4 w-4" />
              Nuevo producto
            </button>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
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

      {isProductFormOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/55">
          <form
            onSubmit={handleCreateProduct}
            className="flex h-full w-full max-w-2xl flex-col bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {editingProductId ? "Editar producto" : "Nuevo producto"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {editingProductId ? "Actualiza la informacion del producto." : "Captura el stock inicial."}
                </p>
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
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Codigo de barras</span>
                    <input
                      ref={barcodeInputRef}
                      required
                      value={productForm.barcode}
                      onChange={(event) => updateProductForm("barcode", event.target.value)}
                      onKeyDown={handleBarcodeKeyDown}
                      placeholder="Escanea o escribe codigo"
                      className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={suggestProductFromBarcode}
                    className={claseBotonPrimario("mt-auto h-11 px-4 text-sm")}
                  >
                    Escanear
                  </button>
                </div>
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  ID automatico: <span className="font-mono text-foreground">{productForm.id || nextProductId}</span>
                </p>
              </div>

              <div className="mt-4 grid gap-4">
                <label className="space-y-1.5 text-sm font-medium text-foreground">
                  <span>Nombre producto</span>
                  <input
                    ref={nameInputRef}
                    required
                    value={productForm.name}
                    onChange={(event) => updateProductForm("name", event.target.value)}
                    placeholder="Nombre sugerido o captura manual"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Categoria</span>
                    <select
                      required
                      value={productForm.category}
                      onChange={(event) => updateProductCategory(event.target.value as CategoryOption)}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Marca</span>
                    <select
                      required
                      value={productForm.brand}
                      onChange={(event) => updateProductForm("brand", event.target.value)}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    >
                      {brandOptions.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Cantidad de cajas</span>
                    <select
                      required
                      value={productForm.unit}
                      onChange={(event) => updateProductForm("unit", event.target.value)}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    >
                      {unitOptions.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit} {unit === "1" ? "caja" : "cajas"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Stock total</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={productForm.stockTotal || ""}
                      onChange={(event) => updateProductForm("stockTotal", event.target.value)}
                      placeholder="0"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Precio</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.salePrice || ""}
                      onChange={(event) => updateProductForm("salePrice", event.target.value)}
                      placeholder="$0.00"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Stock minimo</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={productForm.minStock || ""}
                      onChange={(event) => updateProductForm("minStock", event.target.value)}
                      placeholder="0"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Stock maximo</span>
                    <input
                      required
                      type="number"
                      min={productForm.minStock}
                      step="1"
                      value={productForm.maxStock || ""}
                      onChange={(event) => updateProductForm("maxStock", event.target.value)}
                      placeholder="0"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>
                </div>

                <div className="space-y-1.5 text-sm font-medium text-foreground">
                  <span>Imagen</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-muted"
                    >
                      <Camera className="h-4 w-4" />
                      Camara
                    </button>
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-muted"
                    >
                      <FolderUp className="h-4 w-4" />
                      Subir
                    </button>
                  </div>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => updateProductImage(event.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => updateProductImage(event.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                Usa TAB para avanzar y ENTER en el codigo de barras para sugerir datos. Guardar y continuar
                mantiene categoria, marca, unidad y rangos de stock.
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
              {!editingProductId && (
                <button
                  type="submit"
                  name="productAction"
                  value="continue"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/15"
                >
                  Guardar y continuar
                </button>
              )}
              <button
                type="submit"
                name="productAction"
                value="save"
                className={claseBotonPrimario("h-10 px-4 text-sm")}
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
