import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  ChevronDown,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FolderUp,
  History,
  ImagePlus,
  Layers3,
  MoreHorizontal,
  PackageCheck,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import {
  inventoryMovementsStorageKey,
  productsStorageKey,
  productsUpdatedEvent,
} from "@/features/comercializadora/storage";
import {
  fetchProducts,
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
} from "@/features/comercializadora/productsApi";
import { claseBotonPrimario, claseTarjeta } from "@/shared/ui/estilosDashboard";

type InventoryStatus = "agotado" | "poca disponibilidad" | "disponible";
type StockUnit = "cajas" | "kilos";

type InventoryProduct = {
  id: string;
  barcode: string;
  name: string;
  category: CategoryOption;
  brand: string;
  stockUnit: StockUnit;
  boxes: number;
  kilos: number;
  minStock: number;
  maxStock?: number;
  salePrice: number;
  taxRate: number;
  imageUrl: string;
  stockTotal: number;
  available: number;
  lastMovement?: string;
};

type ProductForm = Omit<InventoryProduct, "available" | "lastMovement">;

type InventoryMovement = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  stockUnit: StockUnit;
  createdAt: string;
  type: "entrada";
};

const cleaningAndHomeCategory = "Limpieza y Hogar";
const categoryOptions = ["Aceites", "Bebidas", "Abarrotes", cleaningAndHomeCategory] as const;
type CategoryOption = (typeof categoryOptions)[number];

const brandOptions = ["Sin marca", "Nutrioli", "Coca-Cola", "Great Value", "Fabuloso"] as const;
const stockUnitOptions: StockUnit[] = ["cajas", "kilos"];

const stockMinimumByUnit: Record<StockUnit, number> = {
  cajas: 5,
  kilos: 50,
};

const emptyProductForm: ProductForm = {
  id: "",
  barcode: "",
  name: "",
  category: "Aceites",
  brand: "Sin marca",
  stockUnit: "cajas",
  boxes: 0,
  kilos: 0,
  minStock: stockMinimumByUnit.cajas,
  maxStock: 0,
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
    stockUnit: "cajas",
    salePrice: 38.9,
    minStock: stockMinimumByUnit.cajas,
    taxRate: 16,
  },
  "7501055300072": {
    name: "Refresco cola 600 ml",
    category: "Bebidas",
    brand: "Coca-Cola",
    stockUnit: "cajas",
    salePrice: 18,
    minStock: stockMinimumByUnit.cajas,
    taxRate: 16,
  },
  "7501035910017": {
    name: "Limpiador multiusos 1 L",
    category: cleaningAndHomeCategory,
    brand: "Fabuloso",
    stockUnit: "cajas",
    salePrice: 31,
    minStock: stockMinimumByUnit.cajas,
    taxRate: 16,
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);

const formatMovementDate = (date: string) =>
  new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

const getStockQuantity = (product: Pick<InventoryProduct, "stockUnit" | "boxes" | "kilos" | "stockTotal">) =>
  product.stockUnit === "kilos" ? product.kilos || product.stockTotal : product.boxes || product.stockTotal;

const getMinimumStock = (stockUnit: StockUnit) => stockMinimumByUnit[stockUnit];

const getStatus = (product: InventoryProduct): InventoryStatus => {
  const stockQuantity = getStockQuantity(product);

  if (stockQuantity <= 0) {
    return "agotado";
  }

  if (stockQuantity <= getMinimumStock(product.stockUnit)) {
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

const getStatusDotClassName = (status: InventoryStatus) => {
  if (status === "disponible") {
    return "bg-success";
  }

  if (status === "poca disponibilidad") {
    return "bg-amber-500";
  }

  return "bg-destructive";
};

const getStockAlert = (product: InventoryProduct, status: InventoryStatus) => {
  if (status === "agotado") {
    return "Sin existencias";
  }

  if (status === "poca disponibilidad") {
    return `Alerta: ${getMinimumStock(product.stockUnit)} ${product.stockUnit} o menos`;
  }

  return "Stock suficiente";
};

const formatStockQuantity = (product: InventoryProduct) =>
  `${getStockQuantity(product)} ${product.stockUnit}`;

const normalizeProductCategory = (category: string): CategoryOption => {
  if (category === "Limpieza") {
    return cleaningAndHomeCategory;
  }

  return categoryOptions.includes(category as CategoryOption) ? (category as CategoryOption) : "Abarrotes";
};

const normalizeProduct = (product: InventoryProduct & { unit?: string }): InventoryProduct => {
  const stockUnit = product.stockUnit ?? "cajas";
  const stockTotal = product.stockTotal ?? 0;
  const boxes = product.boxes ?? (stockUnit === "cajas" ? Number(product.unit) || stockTotal : 0);
  const kilos = product.kilos ?? (stockUnit === "kilos" ? stockTotal : 0);
  const quantity = stockUnit === "kilos" ? kilos : boxes;

  return {
    ...product,
    category: normalizeProductCategory(product.category),
    stockUnit,
    boxes,
    kilos,
    minStock: getMinimumStock(stockUnit),
    stockTotal: quantity,
    available: typeof product.available === "number" ? product.available : quantity,
  };
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
    return storedProducts ? (JSON.parse(storedProducts) as InventoryProduct[]).map(normalizeProduct) : [];
  } catch {
    return [];
  }
};

const loadInventoryMovements = (): InventoryMovement[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedMovements = window.localStorage.getItem(inventoryMovementsStorageKey);
    return storedMovements ? (JSON.parse(storedMovements) as InventoryMovement[]) : [];
  } catch {
    return [];
  }
};

export default function DashboardView() {
  const [products, setProducts] = useState<InventoryProduct[]>(loadStoredProducts);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(loadInventoryMovements);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isStockEntryOpen, setIsStockEntryOpen] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockSuccessMessage, setStockSuccessMessage] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const stockSearchInputRef = useRef<HTMLInputElement>(null);
  const stockQuantityInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const nextProductId = useMemo(() => getNextProductId(products), [products]);

  useEffect(() => {
    window.localStorage.setItem(productsStorageKey, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    window.localStorage.setItem(inventoryMovementsStorageKey, JSON.stringify(inventoryMovements));
  }, [inventoryMovements]);

  useEffect(() => {
    const reloadProducts = () => {
      setProducts(loadStoredProducts());
      setInventoryMovements(loadInventoryMovements());
    };

    window.addEventListener(productsUpdatedEvent, reloadProducts);
    window.addEventListener("storage", reloadProducts);

    return () => {
      window.removeEventListener(productsUpdatedEvent, reloadProducts);
      window.removeEventListener("storage", reloadProducts);
    };
  }, []);

  useEffect(() => {
    fetchProducts()
      .then((items) => {
        if (items.length > 0) {
          setProducts((items as InventoryProduct[]).map(normalizeProduct));
        }
      })
      .catch(() => {});
  }, []);

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

  const selectedStockProduct = useMemo(() => {
    const normalizedSearch = stockSearchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return null;
    }

    return (
      products.find((product) =>
        [product.barcode, product.id]
          .filter(Boolean)
          .some((productCode) => productCode.toLowerCase() === normalizedSearch),
      ) ?? null
    );
  }, [products, stockSearchTerm]);

  useEffect(() => {
    if (!isStockEntryOpen) {
      return;
    }

    const inputToFocus = selectedStockProduct ? stockQuantityInputRef.current : stockSearchInputRef.current;
    window.setTimeout(() => inputToFocus?.focus(), 0);
  }, [isStockEntryOpen, selectedStockProduct]);

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
  const inventoryValue = products.reduce((total, product) => total + getStockQuantity(product) * product.salePrice, 0);
  const lowStockProducts = products.filter((product) => getStatus(product) !== "disponible");
  const stockQuantityNumber = Number(stockQuantity) || 0;
  const currentStockQuantity = selectedStockProduct ? getStockQuantity(selectedStockProduct) : 0;
  const newStockQuantity = currentStockQuantity + stockQuantityNumber;

  const updateProductForm = (field: keyof ProductForm, value: string) => {
    setProductForm((currentForm) => ({
      ...currentForm,
      [field]: ["boxes", "kilos", "minStock", "maxStock", "salePrice", "taxRate", "stockTotal"].includes(field)
        ? Number(value)
        : value,
    }));
  };

  const updateProductCategory = (category: CategoryOption) => {
    setProductForm((currentForm) => ({
      ...currentForm,
      category,
    }));
  };

  const updateStockUnit = (stockUnit: StockUnit) => {
    setProductForm((currentForm) => ({
      ...currentForm,
      stockUnit,
      boxes: stockUnit === "kilos" ? 0 : currentForm.boxes,
      kilos: stockUnit === "cajas" ? 0 : currentForm.kilos,
      minStock: getMinimumStock(stockUnit),
      stockTotal: stockUnit === "kilos" ? currentForm.kilos : currentForm.boxes,
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
      stockUnit: suggestion.stockUnit ?? currentForm.stockUnit,
      salePrice: suggestion.salePrice ?? currentForm.salePrice,
      minStock: suggestion.stockUnit ? getMinimumStock(suggestion.stockUnit) : currentForm.minStock,
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

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        return;
      }

      setProductForm((currentForm) => ({
        ...currentForm,
        imageUrl: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
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
      stockUnit: productForm.stockUnit,
      boxes: 0,
      kilos: 0,
      minStock: getMinimumStock(productForm.stockUnit),
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

  const openStockEntryForm = (product?: InventoryProduct) => {
    setStockSearchTerm(product?.barcode || product?.id || "");
    setStockQuantity("");
    setStockSuccessMessage("");
    setIsStockEntryOpen(true);
  };

  const resetStockEntryForm = () => {
    setStockSearchTerm("");
    setStockQuantity("");
    window.setTimeout(() => stockSearchInputRef.current?.focus(), 0);
  };

  const closeStockEntryForm = () => {
    setIsStockEntryOpen(false);
    setStockSearchTerm("");
    setStockQuantity("");
    setStockSuccessMessage("");
  };

  const handleStockSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (selectedStockProduct) {
      window.setTimeout(() => stockQuantityInputRef.current?.focus(), 0);
    }
  };

  const handleEditProduct = (product: InventoryProduct) => {
    setEditingProductId(product.id);
    setProductForm({
      id: product.id,
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      brand: product.brand,
      stockUnit: product.stockUnit,
      boxes: product.boxes,
      kilos: product.kilos,
      minStock: getMinimumStock(product.stockUnit),
      maxStock: product.maxStock ?? 0,
      salePrice: product.salePrice,
      taxRate: product.taxRate,
      imageUrl: product.imageUrl,
      stockTotal: getStockQuantity(product),
    });
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    const shouldDelete = window.confirm("Eliminar este producto del inventario?");

    if (!shouldDelete) {
      return;
    }

    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
    apiDeleteProduct(productId).catch(() => {});
  };

  const handleAddStock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedStockProduct || stockQuantityNumber <= 0) {
      return;
    }

    const movementDate = new Date().toISOString();
    const previousStock = getStockQuantity(selectedStockProduct);
    const nextStock = previousStock + stockQuantityNumber;
    const updatedProduct: InventoryProduct = {
      ...selectedStockProduct,
      boxes: selectedStockProduct.stockUnit === "cajas" ? nextStock : selectedStockProduct.boxes,
      kilos: selectedStockProduct.stockUnit === "kilos" ? nextStock : selectedStockProduct.kilos,
      stockTotal: nextStock,
      available: nextStock,
      lastMovement: `Entrada inventario: +${stockQuantityNumber} ${selectedStockProduct.stockUnit}`,
    };

    setProducts((currentProducts) =>
      currentProducts.map((product) =>
        product.id === selectedStockProduct.id ? updatedProduct : product,
      ),
    );
    apiUpdateProduct(selectedStockProduct.id, updatedProduct as unknown as Record<string, unknown>).catch(() => {});

    setInventoryMovements((currentMovements) => [
      {
        id: `MOV-${Date.now()}`,
        productId: selectedStockProduct.id,
        productName: selectedStockProduct.name,
        sku: selectedStockProduct.barcode || selectedStockProduct.id,
        quantity: stockQuantityNumber,
        previousStock: currentStockQuantity,
        newStock: newStockQuantity,
        stockUnit: selectedStockProduct.stockUnit,
        createdAt: movementDate,
        type: "entrada",
      },
      ...currentMovements,
    ]);
    setStockSuccessMessage(`Stock agregado a ${selectedStockProduct.name}. Nuevo stock: ${newStockQuantity} ${selectedStockProduct.stockUnit}.`);
    resetStockEntryForm();
  };

  const handleCreateProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const shouldContinue = submitter?.value === "continue";

    if (editingProductId) {
      const stockTotal = productForm.stockUnit === "kilos" ? productForm.kilos : productForm.boxes;
      const updatedProduct = {
        ...(products.find((p) => p.id === editingProductId) ?? {}),
        ...productForm,
        id: editingProductId,
        minStock: getMinimumStock(productForm.stockUnit),
        stockTotal,
        available: stockTotal,
      };

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProductId ? (updatedProduct as InventoryProduct) : product,
        ),
      );
      apiUpdateProduct(editingProductId, updatedProduct as unknown as Record<string, unknown>).catch(() => {});
      resetProductForm();
      return;
    }

    const createdProductId = getNextProductId(products);
    const stockTotal = productForm.stockUnit === "kilos" ? productForm.kilos : productForm.boxes;
    const nextAvailableId = getNextProductId([
      { ...productForm, id: createdProductId, minStock: getMinimumStock(productForm.stockUnit), stockTotal, available: stockTotal },
      ...products,
    ]);
    const newProduct: InventoryProduct = {
      ...productForm,
      id: createdProductId,
      minStock: getMinimumStock(productForm.stockUnit),
      stockTotal,
      available: stockTotal,
      lastMovement: "Producto creado con stock inicial",
    };

    setProducts((currentProducts) => [newProduct, ...currentProducts]);
    apiCreateProduct(newProduct as unknown as Record<string, unknown>).catch(() => {});

    if (shouldContinue) {
      clearProductForm(nextAvailableId);
      return;
    }

    resetProductForm();
  };

  const metrics = [
    {
      label: "Total productos",
      value: String(products.length),
      detail: "SKUs activos",
      icon: Layers3,
      tone: "text-primary bg-primary/10 ring-primary/15",
      valueClassName: "text-3xl",
    },
    {
      label: "Disponibles",
      value: String(availableProducts),
      detail: "Listos para venta",
      icon: PackageCheck,
      tone: "text-success bg-success/10 ring-success/20",
      valueClassName: "text-3xl",
    },
    {
      label: "Stock bajo",
      value: String(lowAvailabilityProducts),
      detail: "Requieren revision",
      icon: AlertTriangle,
      tone: "text-amber-700 bg-amber-100 ring-amber-300/60 dark:text-amber-200 dark:bg-amber-400/15",
      valueClassName: "text-3xl",
    },
    {
      label: "Agotados",
      value: String(soldOutProducts),
      detail: "Sin existencia",
      icon: ClipboardList,
      tone: "text-destructive bg-destructive/10 ring-destructive/20",
      valueClassName: "text-3xl",
    },
    {
      label: "Valor inventario",
      value: formatCurrency(inventoryValue),
      detail: "Costo estimado",
      icon: CircleDollarSign,
      tone: "text-info bg-info/10 ring-info/20",
      valueClassName: "text-2xl leading-tight",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4">
      <section className={claseTarjeta("overflow-hidden")}>
        <div className="border-b border-border/70 bg-card/95 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Centro operativo</p>
              <h3 className="mt-1 text-xl font-bold text-foreground">Inventario principal</h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Lectura rapida de stock, alertas y movimientos del almacen.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-3xl">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Buscar en inventario"
                  placeholder="Buscar por producto, SKU o codigo..."
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm font-medium outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <button
                type="button"
                onClick={openNewProductForm}
                className={claseBotonPrimario("h-11 shrink-0 gap-2 px-5 text-sm font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25")}
              >
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </button>
              <button
                type="button"
                onClick={() => openStockEntryForm()}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/35 bg-primary/10 px-5 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/15"
              >
                <PackagePlus className="h-4 w-4" />
                Agregar Stock
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {quickFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article
              key={metric.label}
              className={claseTarjeta("p-4 transition hover:-translate-y-0.5 hover:shadow-xl")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                  <p className={`mt-2 break-words font-bold text-foreground ${metric.valueClassName}`}>{metric.value}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{metric.detail}</p>
                </div>
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ring-1 ${metric.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.1fr_1fr_1fr]">
        <article className={claseTarjeta("p-4")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 ring-1 ring-amber-300/60 dark:bg-amber-400/15 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Alertas de stock</h3>
                <p className="text-xs font-medium text-muted-foreground">{lowStockProducts.length} productos requieren accion</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 space-y-2">
            {lowStockProducts.slice(0, 3).map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/25 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="text-xs font-medium text-muted-foreground">{getStockAlert(product, getStatus(product))}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-foreground">{formatStockQuantity(product)}</span>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <p className="rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground">
                Sin alertas criticas por ahora.
              </p>
            )}
          </div>
        </article>

        <article className={claseTarjeta("p-4")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                <History className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Movimientos recientes</h3>
                <p className="text-xs font-medium text-muted-foreground">Ultimas entradas al inventario</p>
              </div>
            </div>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 space-y-2">
            {inventoryMovements.length > 0 ? (
              inventoryMovements.slice(0, 4).map((movement) => (
                <div key={movement.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-semibold text-foreground">{movement.productName}</span>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    +{movement.quantity} {movement.stockUnit}
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground">
                Aun no hay movimientos.
              </p>
            )}
          </div>
        </article>

        <article className={claseTarjeta("p-4")}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info ring-1 ring-info/15">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Actividad operativa</h3>
                <p className="text-xs font-medium text-muted-foreground">Entradas, ventas y ajustes</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Entradas", value: String(inventoryMovements.length), icon: PackagePlus },
              { label: "Ventas", value: "0", icon: ShoppingCart },
              { label: "Ajustes", value: "0", icon: ClipboardList },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="rounded-lg border border-border/70 bg-muted/25 px-2 py-2">
                  <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 text-lg font-bold text-foreground">{item.value}</p>
                  <p className="text-[11px] font-semibold text-muted-foreground">{item.label}</p>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className={claseTarjeta("overflow-hidden")}>
        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
          <div>
            <h3 className="text-base font-bold text-foreground">Tabla de inventario</h3>
            <p className="text-xs font-medium text-muted-foreground">Producto, stock y alertas como prioridad visual.</p>
          </div>
          <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {filteredProducts.length} visibles
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="m-3 flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/25 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Inventario sin productos</h3>
                <p className="text-xs font-medium text-muted-foreground">Agrega el primer SKU para iniciar operaciones.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openNewProductForm}
              className={claseBotonPrimario("h-10 shrink-0 gap-2 px-4 text-sm font-semibold")}
            >
              <Plus className="h-4 w-4" />
              Nuevo Producto
            </button>
            <button
              type="button"
              onClick={() => openStockEntryForm()}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/35 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/15"
            >
              <PackagePlus className="h-4 w-4" />
              Agregar Stock
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-10 w-[360px] bg-muted/95 px-4 py-3 font-bold backdrop-blur">Producto</th>
                  <th className="whitespace-nowrap px-4 py-3 font-bold">Stock</th>
                  <th className="whitespace-nowrap px-4 py-3 font-bold">Estado</th>
                  <th className="whitespace-nowrap px-4 py-3 font-bold">Alerta</th>
                  <th className="whitespace-nowrap px-4 py-3 font-bold">Detalles</th>
                  <th className="sticky right-0 z-10 bg-muted/95 px-4 py-3 text-right font-bold backdrop-blur">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {filteredProducts.map((product) => {
                  const status = getStatus(product);
                  const stockAlert = getStockAlert(product, status);

                  return (
                    <tr key={product.id} className="group bg-card transition hover:bg-primary/[0.035]">
                      <td className="sticky left-0 z-10 bg-card px-4 py-3 transition group-hover:bg-[#f6fbf5] dark:group-hover:bg-muted">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover ring-1 ring-border"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                              <ImagePlus className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
                            <p className="truncate text-xs font-medium text-muted-foreground">
                              {product.brand || "Sin marca"} · {product.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-base font-bold text-foreground">{formatStockQuantity(product)}</p>
                        <p className="text-xs font-medium text-muted-foreground">
                          Min. {getMinimumStock(product.stockUnit)} {product.stockUnit}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ${getStatusClassName(status)}`}>
                          <span className={`h-2 w-2 rounded-full ${getStatusDotClassName(status)}`} />
                          {status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-muted-foreground">
                        {stockAlert}
                      </td>
                      <td className="px-4 py-3">
                        <details className="group/details">
                          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
                            Ver datos
                            <ChevronDown className="h-3.5 w-3.5 transition group-open/details:rotate-180" />
                          </summary>
                          <div className="mt-2 grid min-w-56 gap-1 rounded-lg border border-border bg-background p-3 text-xs font-medium text-muted-foreground shadow-lg">
                            <span>Categoria: {product.category}</span>
                            <span>Codigo: {product.barcode}</span>
                            <span>Precio: {formatCurrency(product.salePrice)}</span>
                          </div>
                        </details>
                      </td>
                      <td className="sticky right-0 z-10 bg-card px-4 py-3 transition group-hover:bg-[#f6fbf5] dark:group-hover:bg-muted">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openStockEntryForm(product)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 text-sm font-semibold text-primary transition hover:bg-primary/15"
                          >
                            <PackagePlus className="h-4 w-4" />
                            Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditProduct(product)}
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/5"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 text-destructive transition hover:bg-destructive/15"
                            aria-label={`Eliminar ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr]">
        <article className={claseTarjeta("p-4")}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Ventas del dia</h3>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-3 text-2xl font-bold text-foreground">$0.00</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Se alimenta desde ventas registradas.</p>
        </article>

        <article className={claseTarjeta("p-4")}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Ultimas entradas</h3>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 space-y-2">
            {inventoryMovements.length > 0 ? (
              inventoryMovements.slice(0, 3).map((movement) => (
                <div key={movement.id} className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-semibold text-foreground">{movement.productName}</span>
                    <span className="shrink-0 font-bold text-success">+{movement.quantity}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {movement.previousStock} a {movement.newStock} {movement.stockUnit} · {formatMovementDate(movement.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground">
                Sin entradas registradas.
              </div>
            )}
          </div>
        </article>

        <article className={claseTarjeta("p-4")}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Reportes secundarios</h3>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-muted-foreground">
            Ventas por categoria y rotacion apareceran aqui.
          </div>
        </article>
      </section>

      {isStockEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-3 sm:p-6">
          <form
            onSubmit={handleAddStock}
            className="my-auto flex w-full max-w-3xl flex-col rounded-lg bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Agregar Stock</h3>
                <p className="text-sm text-muted-foreground">
                  Escanea o escribe codigo de barras, SKU o ID del producto.
                </p>
              </div>
              <button
                type="button"
                onClick={closeStockEntryForm}
                aria-label="Cerrar entrada de inventario"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 p-5">
              {stockSuccessMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {stockSuccessMessage}
                </div>
              )}

              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>Buscar producto</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={stockSearchInputRef}
                    value={stockSearchTerm}
                    onChange={(event) => {
                      setStockSearchTerm(event.target.value);
                      setStockSuccessMessage("");
                      setStockQuantity("");
                    }}
                    onKeyDown={handleStockSearchKeyDown}
                    placeholder="7501055300001, SKU o PROD-000001"
                    className="h-12 w-full rounded-lg border border-input bg-background pl-10 pr-3 font-mono text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </label>

              {stockSearchTerm.trim() && !selectedStockProduct && (
                <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                  Producto no encontrado. Verifica el codigo, SKU o ID.
                </div>
              )}

              {selectedStockProduct && (
                <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                  <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
                    {selectedStockProduct.imageUrl ? (
                      <img
                        src={selectedStockProduct.imageUrl}
                        alt={selectedStockProduct.name}
                        className="h-44 w-full object-cover lg:h-full"
                      />
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center text-primary lg:h-full">
                        <ImagePlus className="h-10 w-10" />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/10 px-3 py-2 text-sm font-bold text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      Producto encontrado
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: "Nombre", value: selectedStockProduct.name },
                        { label: "Codigo/SKU", value: selectedStockProduct.barcode || selectedStockProduct.id },
                        { label: "ID", value: selectedStockProduct.id },
                        { label: "Categoria", value: selectedStockProduct.category },
                        { label: "Precio", value: formatCurrency(selectedStockProduct.salePrice) },
                        { label: "Stock actual", value: formatStockQuantity(selectedStockProduct) },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-border bg-muted/25 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="mt-1 break-words text-sm font-bold text-foreground">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <label className="space-y-1.5 text-sm font-medium text-foreground">
                      <span>Cantidad a ingresar</span>
                      <input
                        ref={stockQuantityInputRef}
                        required
                        type="number"
                        min={selectedStockProduct.stockUnit === "kilos" ? "0.01" : "1"}
                        step={selectedStockProduct.stockUnit === "kilos" ? "0.01" : "1"}
                        value={stockQuantity}
                        onChange={(event) => setStockQuantity(event.target.value)}
                        placeholder="0"
                        className="h-12 w-full rounded-lg border border-input bg-background px-3 text-lg font-bold outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                      />
                    </label>

                    <div className="grid gap-2 rounded-lg border border-border bg-background p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-muted-foreground">Stock actual</span>
                        <span className="font-bold text-foreground">
                          {currentStockQuantity} {selectedStockProduct.stockUnit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-muted-foreground">Cantidad recibida</span>
                        <span className="font-bold text-foreground">
                          {stockQuantityNumber} {selectedStockProduct.stockUnit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                        <span className="font-bold text-foreground">Nuevo stock</span>
                        <span className="text-lg font-bold text-success">
                          {newStockQuantity} {selectedStockProduct.stockUnit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-border p-5">
              <button
                type="button"
                onClick={closeStockEntryForm}
                className="h-10 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!selectedStockProduct || stockQuantityNumber <= 0}
                className={claseBotonPrimario("h-10 gap-2 px-4 text-sm disabled:pointer-events-none disabled:opacity-50")}
              >
                <PackagePlus className="h-4 w-4" />
                Agregar Stock
              </button>
            </div>
          </form>
        </div>
      )}

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
                <div className="grid gap-3">
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Codigo de barras</span>
                    <input
                      ref={barcodeInputRef}
                      required
                      value={productForm.barcode}
                      onChange={(event) => updateProductForm("barcode", event.target.value)}
                      onKeyDown={handleBarcodeKeyDown}
                      placeholder="Escribe codigo de barras"
                      className="h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>
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

                <div className="grid gap-4 md:grid-cols-2">
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
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-foreground">Unidad, cajas y kilos</h4>
                    <span className="text-xs font-medium text-muted-foreground">
                      Minimo: {getMinimumStock(productForm.stockUnit)} {productForm.stockUnit}
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-1.5 text-sm font-medium text-foreground">
                      <span>Unidad</span>
                      <select
                        required
                        value={productForm.stockUnit}
                        onChange={(event) => updateStockUnit(event.target.value as StockUnit)}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                      >
                        {stockUnitOptions.map((stockUnit) => (
                          <option key={stockUnit} value={stockUnit}>
                            {stockUnit}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1.5 text-sm font-medium text-foreground">
                      <span>Cajas</span>
                      <input
                        required={productForm.stockUnit === "cajas"}
                        type="number"
                        min="0"
                        step="1"
                        value={productForm.boxes || ""}
                        onChange={(event) => updateProductForm("boxes", event.target.value)}
                        placeholder="0"
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                      />
                    </label>

                    <label className="space-y-1.5 text-sm font-medium text-foreground">
                      <span>Kilos</span>
                      <input
                        required={productForm.stockUnit === "kilos"}
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.kilos || ""}
                        onChange={(event) => updateProductForm("kilos", event.target.value)}
                        placeholder="0"
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                </div>

                <div className="space-y-1.5 text-sm font-medium text-foreground">
                  <span>Imagen</span>
                  <div className="flex flex-wrap gap-2">
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
                mantiene categoria, marca y unidad.
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
