import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  AlertTriangle,
  Boxes,
  ChevronDown,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FolderUp,
  ImagePlus,
  Layers3,
  PackageCheck,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  defaultInventoryCatalogs,
  getManufacturerNameForBrand,
  getSubcategoriesByCategoryName,
  normalizeInventoryCatalogs,
  inventoryCategories,
  type InventoryCatalogs,
} from "@/features/comercializadora/catalogs";
import { fetchCatalogs, saveCatalogs } from "@/features/comercializadora/catalogsApi";
import {
  catalogsStorageKey,
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
import {
  normalizeBarcode,
  normalizeProductId,
  isValidSimpleBarcode,
  validateProductIdentity,
  type ProductValidationErrors,
} from "@/features/comercializadora/productValidation";
import { claseBotonPrimario, claseTarjeta } from "@/shared/ui/estilosDashboard";

type InventoryStatus = "agotado" | "poca disponibilidad" | "disponible";
type StockUnit = "cajas" | "kilos" | "piezas";
type PriceType = "pieza" | "caja" | "kilo";

type InventoryProduct = {
  id: string;
  barcode: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  manufacturer: string;
  stockUnit: StockUnit;
  boxes: number;
  kilos: number;
  pieces: number;
  piecesPerBox: number;
  minStock: number;
  maxStock?: number;
  purchasePrice: number;
  salePrice: number;
  tipoPrecio: PriceType;
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
const legacyCategoryMap: Record<string, string> = {
  Aceites: "Pastas, arroz y básicos",
  Abarrotes: "Pastas, arroz y básicos",
  Limpieza: "Limpieza del hogar",
  [cleaningAndHomeCategory]: "Limpieza del hogar",
};
const stockUnitOptions: StockUnit[] = ["cajas", "kilos", "piezas"];
const stockMinimumByUnit: Record<StockUnit, number> = {
  cajas: 5,
  kilos: 50,
  piezas: 50,
};

const emptyProductForm: ProductForm = {
  id: "",
  barcode: "",
  name: "",
  category: "",
  subcategory: "",
  brand: "",
  manufacturer: "",
  stockUnit: "cajas",
  boxes: 0,
  kilos: 0,
  pieces: 0,
  piecesPerBox: 0,
  minStock: stockMinimumByUnit.cajas,
  maxStock: 0,
  purchasePrice: 0,
  salePrice: 0,
  tipoPrecio: "caja",
  taxRate: 16,
  imageUrl: "",
  stockTotal: 0,
};

const barcodeSuggestions: Record<string, Partial<ProductForm>> = {
  "7501023501128": {
    name: "Aceite vegetal 1 L",
    category: "Pastas, arroz y básicos",
    subcategory: "Aceites",
    brand: "Precissimo",
    stockUnit: "cajas",
    purchasePrice: 32,
    salePrice: 38.9,
    minStock: stockMinimumByUnit.cajas,
    taxRate: 16,
  },
  "7501055300072": {
    name: "Refresco cola 600 ml",
    category: "Bebidas",
    subcategory: "Refrescos",
    brand: "Coca-Cola",
    stockUnit: "cajas",
    purchasePrice: 14,
    salePrice: 18,
    minStock: stockMinimumByUnit.cajas,
    taxRate: 16,
  },
  "7501035910017": {
    name: "Limpiador multiusos 1 L",
    category: "Limpieza del hogar",
    subcategory: "Limpiadores",
    brand: "Fabuloso",
    stockUnit: "cajas",
    purchasePrice: 25,
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

const getStockQuantity = (
  product: Pick<InventoryProduct, "stockUnit" | "boxes" | "kilos" | "pieces" | "piecesPerBox" | "stockTotal">,
) => {
  if (product.stockUnit === "kilos") {
    return product.kilos || product.stockTotal;
  }

  if (product.stockUnit === "piezas") {
    return product.pieces || product.stockTotal;
  }

  return product.boxes || Math.floor((product.stockTotal || 0) / Math.max(1, product.piecesPerBox || 1));
};

const getSellableStock = (
  product: Pick<InventoryProduct, "stockUnit" | "boxes" | "kilos" | "pieces" | "piecesPerBox" | "stockTotal">,
) => {
  if (product.stockUnit === "cajas") {
    return product.stockTotal || product.boxes * Math.max(1, product.piecesPerBox || 1);
  }

  return getStockQuantity(product);
};

const getStockTotalFromForm = (form: ProductForm) => {
  if (form.stockUnit === "kilos") {
    return form.kilos;
  }

  if (form.stockUnit === "piezas") {
    return form.pieces;
  }

  return form.boxes * Math.max(1, form.piecesPerBox || 0);
};

const getPriceTypeForUnit = (stockUnit: StockUnit): PriceType => {
  if (stockUnit === "kilos") {
    return "kilo";
  }

  if (stockUnit === "piezas") {
    return "pieza";
  }

  return "caja";
};

const getMinimumStock = (stockUnit: StockUnit) => stockMinimumByUnit[stockUnit];

const getFieldClassName = (hasError?: boolean) =>
  `w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 ${
    hasError
      ? "border-destructive text-destructive focus:border-destructive focus:ring-destructive/20"
      : "border-input focus:border-primary focus:ring-ring/20"
  }`;

const getSelectClassName = (hasError?: boolean) => `${getFieldClassName(hasError)} appearance-none pr-3`;

const formLabelClassName =
  "space-y-1.5 text-sm font-semibold leading-none text-foreground [&>span:first-child]:block [&>span:first-child]:text-sm [&>span:first-child]:font-semibold [&>span:first-child]:leading-5 [&>span:first-child]:text-foreground";

type SearchableBrandSelectProps = {
  value: string;
  options: string[];
  hasError?: boolean;
  onChange: (value: string) => void;
};

function SearchableBrandSelect({ value, options, hasError, onChange }: SearchableBrandSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  return (
    <div className="relative">
      <input
        required
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="brand-options"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          onChange("");
        }}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        placeholder="Buscar marca"
        className={`h-10 ${getFieldClassName(hasError)}`}
      />
      {isOpen && (
        <div
          id="brand-options"
          className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-20 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-xl"
        >
          {filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option);
                setQuery(option);
                setIsOpen(false);
              }}
              className={`flex w-full rounded-md px-3 py-2 text-left text-sm font-medium transition hover:bg-primary/10 hover:text-foreground ${
                option === value ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
            >
              {option}
            </button>
          ))}
          {filteredOptions.length === 0 && (
            <p className="px-3 py-2 text-sm font-medium text-muted-foreground">Sin marcas encontradas.</p>
          )}
        </div>
      )}
    </div>
  );
}

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

const formatUnitLabel = (unit: StockUnit) => {
  if (unit === "kilos") {
    return "kilos";
  }

  if (unit === "piezas") {
    return "piezas";
  }

  return "cajas";
};

const formatPriceType = (priceType: PriceType) => {
  if (priceType === "kilo") {
    return "kilo";
  }

  if (priceType === "pieza") {
    return "pieza";
  }

  return "caja";
};

const formatStockQuantity = (product: InventoryProduct) => {
  if (product.stockUnit === "cajas") {
    return `${product.boxes} cajas (${getSellableStock(product)} piezas)`;
  }

  return `${getStockQuantity(product)} ${formatUnitLabel(product.stockUnit)}`;
};

const normalizeProductCategory = (category: string) => {
  const normalizedCategory = legacyCategoryMap[category] ?? category;
  const categoryOptions = inventoryCategories.map((catalogCategory) => catalogCategory.name);

  return categoryOptions.includes(normalizedCategory) ? normalizedCategory : "Pastas, arroz y básicos";
};

const getDefaultSubcategory = (category: string) => getSubcategoriesByCategoryName(category)[0]?.name ?? "";

const normalizeProduct = (product: InventoryProduct & { unit?: string; price?: number; priceType?: PriceType }): InventoryProduct => {
  const stockUnit = product.stockUnit ?? "cajas";
  const stockTotal = product.stockTotal ?? 0;
  const category = normalizeProductCategory(product.category);
  const brand = product.brand || "Sin marca";
  const categorySubcategories = getSubcategoriesByCategoryName(category);
  const subcategory = categorySubcategories.some((item) => item.name === product.subcategory)
    ? product.subcategory
    : getDefaultSubcategory(category);
  const boxes = product.boxes ?? (stockUnit === "cajas" ? Number(product.unit) || stockTotal : 0);
  const kilos = product.kilos ?? (stockUnit === "kilos" ? stockTotal : 0);
  const piecesPerBox = product.piecesPerBox ?? 0;
  const pieces = product.pieces ?? (stockUnit === "piezas" ? stockTotal : 0);
  const quantity =
    stockUnit === "kilos"
      ? kilos
      : stockUnit === "piezas"
        ? pieces
        : stockTotal || boxes * Math.max(1, piecesPerBox || 1);

  return {
    ...product,
    id: normalizeProductId(product.id),
    barcode: normalizeBarcode(product.barcode),
    category,
    subcategory,
    brand,
    manufacturer: product.manufacturer || getManufacturerNameForBrand(brand),
    stockUnit,
    boxes,
    kilos,
    pieces,
    piecesPerBox,
    minStock: getMinimumStock(stockUnit),
    purchasePrice: product.purchasePrice ?? 0,
    salePrice: product.salePrice ?? product.price ?? 0,
    tipoPrecio: product.tipoPrecio ?? product.priceType ?? getPriceTypeForUnit(stockUnit),
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

const loadStoredCatalogs = (): InventoryCatalogs => {
  if (typeof window === "undefined") {
    return defaultInventoryCatalogs;
  }

  try {
    const storedCatalogs = window.localStorage.getItem(catalogsStorageKey);
    return storedCatalogs
      ? normalizeInventoryCatalogs(JSON.parse(storedCatalogs) as Partial<InventoryCatalogs>)
      : defaultInventoryCatalogs;
  } catch {
    return defaultInventoryCatalogs;
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
  const [catalogs, setCatalogs] = useState<InventoryCatalogs>(loadStoredCatalogs);
  const [products, setProducts] = useState<InventoryProduct[]>(loadStoredProducts);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(loadInventoryMovements);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isStockEntryOpen, setIsStockEntryOpen] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [productFormErrors, setProductFormErrors] = useState<ProductValidationErrors>({});
  const [productFormServerError, setProductFormServerError] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockSuccessMessage, setStockSuccessMessage] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const stockSearchInputRef = useRef<HTMLInputElement>(null);
  const stockQuantityInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const nextProductId = useMemo(() => getNextProductId(products), [products]);
  const categoryOptions = useMemo(() => catalogs.categories.map((category) => category.name), [catalogs.categories]);
  const brandOptions = useMemo(() => catalogs.brands.map((brand) => brand.name), [catalogs.brands]);
  const selectedCategorySubcategories = useMemo(
    () => getSubcategoriesByCategoryName(productForm.category, catalogs),
    [catalogs, productForm.category],
  );
  const selectedBrandManufacturer = getManufacturerNameForBrand(productForm.brand, catalogs);
  const hasValidBarcodeLength = isValidSimpleBarcode(productForm.barcode);
  const hasProductFormErrors = Object.keys(productFormErrors).length > 0;

  useEffect(() => {
    if (!isProductFormOpen) {
      return;
    }

    setProductFormErrors(validateProductIdentity(productForm, products, editingProductId));
  }, [editingProductId, isProductFormOpen, productForm, products]);

  useEffect(() => {
    window.localStorage.setItem(productsStorageKey, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    window.localStorage.setItem(catalogsStorageKey, JSON.stringify(catalogs));
  }, [catalogs]);

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
    fetchCatalogs()
      .then((remoteCatalogs) => setCatalogs(normalizeInventoryCatalogs(remoteCatalogs)))
      .catch(() => {
        saveCatalogs(defaultInventoryCatalogs).catch(() => {});
      });
  }, []);

  useEffect(() => {
    if (!isProductFormOpen) {
      return;
    }

    setProductForm((currentForm) => ({
      ...currentForm,
      id: editingProductId ? currentForm.id : currentForm.id || nextProductId,
    }));
    window.setTimeout(() => nameInputRef.current?.focus(), 0);
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
      [product.id, product.barcode, product.name, product.brand]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [products, searchTerm]);

  const availableProducts = products.filter((product) => getStatus(product) === "disponible").length;
  const lowAvailabilityProducts = products.filter((product) => getStatus(product) === "poca disponibilidad").length;
  const soldOutProducts = products.filter((product) => getStatus(product) === "agotado").length;
  const inventoryValue = products.reduce((total, product) => {
    const stockForPrice = product.tipoPrecio === "caja" ? product.boxes : getSellableStock(product);
    return total + stockForPrice * (product.purchasePrice || product.salePrice);
  }, 0);
  const stockQuantityNumber = Number(stockQuantity) || 0;
  const currentStockQuantity = selectedStockProduct ? getStockQuantity(selectedStockProduct) : 0;
  const newStockQuantity = currentStockQuantity + stockQuantityNumber;

  const updateProductForm = (field: keyof ProductForm, value: string) => {
    setProductFormServerError("");
    setProductForm((currentForm) => ({
      ...currentForm,
      [field]: ["boxes", "kilos", "pieces", "piecesPerBox", "minStock", "maxStock", "purchasePrice", "salePrice", "taxRate", "stockTotal"].includes(field)
        ? Number(value)
        : field === "barcode"
          ? normalizeBarcode(value)
          : field === "id"
            ? normalizeProductId(value)
            : value,
      ...(field === "brand" ? { manufacturer: getManufacturerNameForBrand(value, catalogs) } : {}),
    }));
  };

  const updateProductCategory = (category: string) => {
    setProductFormServerError("");
    setProductForm((currentForm) => ({
      ...currentForm,
      category,
      subcategory: "",
    }));
  };

  const updateStockUnit = (stockUnit: StockUnit) => {
    setProductForm((currentForm) => ({
      ...currentForm,
      stockUnit,
      boxes: stockUnit === "cajas" ? currentForm.boxes : 0,
      kilos: stockUnit === "kilos" ? currentForm.kilos : 0,
      pieces: stockUnit === "piezas" ? currentForm.pieces : 0,
      piecesPerBox: stockUnit === "cajas" ? currentForm.piecesPerBox : 0,
      minStock: getMinimumStock(stockUnit),
      tipoPrecio: getPriceTypeForUnit(stockUnit),
      stockTotal:
        stockUnit === "kilos"
          ? currentForm.kilos
          : stockUnit === "piezas"
            ? currentForm.pieces
            : currentForm.boxes * Math.max(1, currentForm.piecesPerBox || 0),
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
      subcategory: suggestion.subcategory ?? (suggestion.category ? "" : currentForm.subcategory),
      brand: suggestion.brand ?? currentForm.brand,
      manufacturer: suggestion.brand
        ? getManufacturerNameForBrand(suggestion.brand, catalogs)
        : currentForm.manufacturer,
      stockUnit: suggestion.stockUnit ?? currentForm.stockUnit,
      purchasePrice: suggestion.purchasePrice ?? currentForm.purchasePrice,
      salePrice: suggestion.salePrice ?? currentForm.salePrice,
      tipoPrecio: suggestion.tipoPrecio ?? currentForm.tipoPrecio,
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
    window.setTimeout(() => idInputRef.current?.focus(), 0);
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
    setProductFormErrors({});
    setProductFormServerError("");
    setEditingProductId(null);
    setIsProductFormOpen(false);
  };

  const clearProductForm = (nextId = nextProductId) => {
    setProductForm({
      ...emptyProductForm,
      id: nextId,
      brand: productForm.brand,
      manufacturer: productForm.manufacturer,
      stockUnit: productForm.stockUnit,
      boxes: 0,
      kilos: 0,
      pieces: 0,
      piecesPerBox: productForm.stockUnit === "cajas" ? productForm.piecesPerBox : 0,
      minStock: getMinimumStock(productForm.stockUnit),
      purchasePrice: 0,
      salePrice: 0,
      tipoPrecio: getPriceTypeForUnit(productForm.stockUnit),
    });
    window.setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const openNewProductForm = () => {
    setEditingProductId(null);
    setProductFormErrors({});
    setProductFormServerError("");
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
      subcategory: product.subcategory,
      brand: product.brand,
      manufacturer: product.manufacturer,
      stockUnit: product.stockUnit,
      boxes: product.boxes,
      kilos: product.kilos,
      pieces: product.pieces,
      piecesPerBox: product.piecesPerBox,
      minStock: getMinimumStock(product.stockUnit),
      maxStock: product.maxStock ?? 0,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      tipoPrecio: product.tipoPrecio,
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
      currentProducts.map((product) => {
        if (product.id !== selectedStockProduct.id) {
          return product;
        }

        const previousStock = getStockQuantity(product);
        const nextStock = previousStock + stockQuantityNumber;

        return {
          ...product,
          boxes: product.stockUnit === "cajas" ? nextStock : product.boxes,
          kilos: product.stockUnit === "kilos" ? nextStock : product.kilos,
          pieces: product.stockUnit === "piezas" ? nextStock : product.pieces,
          stockTotal: product.stockUnit === "cajas" ? nextStock * Math.max(1, product.piecesPerBox || 1) : nextStock,
          available: product.stockUnit === "cajas" ? nextStock * Math.max(1, product.piecesPerBox || 1) : nextStock,
          lastMovement: `Entrada inventario: +${stockQuantityNumber} ${product.stockUnit}`,
        };
      }),
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
    setStockSuccessMessage(
      `Stock agregado a ${selectedStockProduct.name}. Nuevo stock: ${newStockQuantity} ${formatUnitLabel(selectedStockProduct.stockUnit)}.`,
    );
    resetStockEntryForm();
  };

  const persistProduct = async (product: InventoryProduct, previousProductId?: string) => {
    if (previousProductId) {
      await apiUpdateProduct(previousProductId, product as unknown as Record<string, unknown>);
      return;
    }

    await apiCreateProduct(product as unknown as Record<string, unknown>);
  };

  const getApiErrorMessage = (error: unknown) =>
    error instanceof Error && error.message
      ? error.message
      : "No se pudo guardar el producto. Intenta nuevamente.";

  const isLocalOnlyPersistenceError = (error: unknown) =>
    error instanceof TypeError || (error instanceof Error && error.message === "Error 404");

  const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const shouldContinue = submitter?.value === "continue";
    const validationErrors = validateProductIdentity(productForm, products, editingProductId);

    setProductFormErrors(validationErrors);
    setProductFormServerError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (editingProductId) {
      const stockTotal = getStockTotalFromForm(productForm);
      const previousProduct = products.find((p) => p.id === editingProductId);
      const updatedProduct = {
        ...(previousProduct ?? {}),
        ...productForm,
        id: normalizeProductId(productForm.id),
        barcode: normalizeBarcode(productForm.barcode),
        manufacturer: productForm.manufacturer || getManufacturerNameForBrand(productForm.brand, catalogs),
        minStock: getMinimumStock(productForm.stockUnit),
        stockTotal,
        available: stockTotal,
      };

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProductId ? (updatedProduct as InventoryProduct) : product,
        ),
      );
      try {
        await persistProduct(updatedProduct as InventoryProduct, editingProductId);
      } catch (error) {
        if (isLocalOnlyPersistenceError(error)) {
          resetProductForm();
          return;
        }

        if (previousProduct) {
          setProducts((currentProducts) =>
            currentProducts.map((product) => (product.id === updatedProduct.id ? previousProduct : product)),
          );
        }
        setProductFormServerError(getApiErrorMessage(error));
        return;
      }
      resetProductForm();
      return;
    }

    const createdProductId = normalizeProductId(productForm.id || getNextProductId(products));
    const stockTotal = getStockTotalFromForm(productForm);
    const nextAvailableId = getNextProductId([
      { ...productForm, id: createdProductId, minStock: getMinimumStock(productForm.stockUnit), stockTotal, available: stockTotal },
      ...products,
    ]);
    const newProduct: InventoryProduct = {
      ...productForm,
      id: createdProductId,
      barcode: normalizeBarcode(productForm.barcode),
      manufacturer: productForm.manufacturer || getManufacturerNameForBrand(productForm.brand, catalogs),
      minStock: getMinimumStock(productForm.stockUnit),
      stockTotal,
      available: stockTotal,
      lastMovement: "Producto creado con stock inicial",
    };

    setProducts((currentProducts) => [newProduct, ...currentProducts]);
    try {
      await persistProduct(newProduct);
    } catch (error) {
      if (isLocalOnlyPersistenceError(error)) {
        if (shouldContinue) {
          clearProductForm(nextAvailableId);
          return;
        }

        resetProductForm();
        return;
      }

      setProducts((currentProducts) => currentProducts.filter((product) => product.id !== newProduct.id));
      setProductFormServerError(getApiErrorMessage(error));
      return;
    }

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
                              {product.id} · {product.barcode || "Sin código"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-base font-bold text-foreground">{formatStockQuantity(product)}</p>
                        <p className="text-xs font-medium text-muted-foreground">
                          Min. {getMinimumStock(product.stockUnit)} {formatUnitLabel(product.stockUnit)}
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
                            <span>Codigo: {product.barcode}</span>
                            <span>ID: {product.id}</span>
                            <span>
                              Precio: {formatCurrency(product.salePrice)} por {formatPriceType(product.tipoPrecio)}
                            </span>
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

              <label className={formLabelClassName}>
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

                    <label className={formLabelClassName}>
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
                          {currentStockQuantity} {formatUnitLabel(selectedStockProduct.stockUnit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-muted-foreground">Cantidad recibida</span>
                        <span className="font-bold text-foreground">
                          {stockQuantityNumber} {formatUnitLabel(selectedStockProduct.stockUnit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                        <span className="font-bold text-foreground">Nuevo stock</span>
                        <span className="text-lg font-bold text-success">
                          {newStockQuantity} {formatUnitLabel(selectedStockProduct.stockUnit)}
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
                  {editingProductId ? "Actualiza la información del producto." : "Captura el stock inicial."}
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
              <section className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-foreground">Información general</h4>
                  <span className="text-xs font-medium text-muted-foreground">
                    Sugerido: <span className="font-mono text-foreground">{nextProductId}</span>
                  </span>
                </div>
                <div className="grid gap-4">
                  <label className={formLabelClassName}>
                    <span>Nombre del producto *</span>
                    <input
                      ref={nameInputRef}
                      required
                      value={productForm.name}
                      onChange={(event) => updateProductForm("name", event.target.value)}
                      placeholder="Nombre sugerido o captura manual"
                      className={`h-10 ${getFieldClassName(Boolean(productFormErrors.name))}`}
                    />
                    {productFormErrors.name && (
                      <p className="text-xs font-semibold text-destructive">{productFormErrors.name}</p>
                    )}
                  </label>

                  <label className={formLabelClassName}>
                    <span>Código de barras *</span>
                    <input
                      ref={barcodeInputRef}
                      required
                      value={productForm.barcode}
                      onChange={(event) => updateProductForm("barcode", event.target.value)}
                      onKeyDown={handleBarcodeKeyDown}
                      placeholder="Escribe código de barras"
                      className={`h-11 font-mono ${getFieldClassName(Boolean(productFormErrors.barcode))}`}
                    />
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {productFormErrors.barcode ? (
                        <p className="font-semibold text-destructive">{productFormErrors.barcode}</p>
                      ) : productForm.barcode && hasValidBarcodeLength ? (
                        <p className="font-semibold text-success">Código de barras válido.</p>
                      ) : (
                        <p className="font-medium text-muted-foreground">Solo números, de 8 a 20 dígitos.</p>
                      )}
                    </div>
                  </label>

                  <label className={formLabelClassName}>
                    <span>ID del producto *</span>
                    <input
                      ref={idInputRef}
                      required
                      value={productForm.id}
                      onChange={(event) => updateProductForm("id", event.target.value)}
                      placeholder="PROD-000001"
                      className={`h-10 font-mono ${getFieldClassName(Boolean(productFormErrors.id))}`}
                    />
                    {productFormErrors.id ? (
                      <p className="text-xs font-semibold text-destructive">{productFormErrors.id}</p>
                    ) : (
                      <p className="text-xs font-medium text-muted-foreground">
                        Sugerido: {nextProductId}
                      </p>
                    )}
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className={formLabelClassName}>
                      <span>Categoría *</span>
                      <select
                        required
                        value={productForm.category}
                        onChange={(event) => updateProductCategory(event.target.value)}
                        className={`h-10 ${getSelectClassName(Boolean(productFormErrors.category))}`}
                      >
                        <option value="">Selecciona una categoría</option>
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {catalogs.categories.find((item) => item.name === category)?.icon} {category}
                          </option>
                        ))}
                      </select>
                      {productFormErrors.category && (
                        <p className="text-xs font-semibold leading-5 text-destructive">{productFormErrors.category}</p>
                      )}
                    </label>

                    <label className={formLabelClassName}>
                      <span>Subcategoría *</span>
                      <select
                        required
                        disabled={!productForm.category}
                        value={productForm.subcategory}
                        onChange={(event) => updateProductForm("subcategory", event.target.value)}
                        className={`h-10 disabled:cursor-not-allowed disabled:opacity-60 ${getSelectClassName(Boolean(productFormErrors.subcategory))}`}
                      >
                        <option value="">
                          {productForm.category ? "Selecciona una subcategoría" : "Selecciona categoría primero"}
                        </option>
                        {selectedCategorySubcategories.map((subcategory) => (
                          <option key={subcategory.id} value={subcategory.name}>
                            {subcategory.name}
                          </option>
                        ))}
                      </select>
                      {productFormErrors.subcategory && (
                        <p className="text-xs font-semibold leading-5 text-destructive">{productFormErrors.subcategory}</p>
                      )}
                    </label>

                    <label className={formLabelClassName}>
                      <span>Marca *</span>
                      <SearchableBrandSelect
                        value={productForm.brand}
                        options={brandOptions}
                        hasError={Boolean(productFormErrors.brand)}
                        onChange={(brand) => updateProductForm("brand", brand)}
                      />
                      {selectedBrandManufacturer && (
                        <p className="text-xs font-medium leading-5 text-muted-foreground">
                          Corporativo asociado: {selectedBrandManufacturer}
                        </p>
                      )}
                      {productFormErrors.brand && (
                        <p className="text-xs font-semibold leading-5 text-destructive">{productFormErrors.brand}</p>
                      )}
                    </label>
                  </div>

                  {productFormServerError && (
                    <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
                      {productFormServerError}
                    </div>
                  )}
                </div>
              </section>

              <section className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Precios</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={formLabelClassName}>
                    <span>Precio de compra</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.purchasePrice || ""}
                      onChange={(event) => updateProductForm("purchasePrice", event.target.value)}
                      placeholder="$0.00"
                      className={`h-10 ${getFieldClassName()}`}
                    />
                  </label>

                  <label className={formLabelClassName}>
                    <span>Precio de venta</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.salePrice || ""}
                      onChange={(event) => updateProductForm("salePrice", event.target.value)}
                      placeholder="$0.00"
                      className={`h-10 ${getFieldClassName()}`}
                    />
                  </label>
                </div>
              </section>

              <section className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-foreground">Stock</h4>
                  <span className="text-xs font-medium text-muted-foreground">
                    Mínimo: {getMinimumStock(productForm.stockUnit)} {formatUnitLabel(productForm.stockUnit)}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className={formLabelClassName}>
                    <span>Unidad</span>
                    <select
                      required
                      value={productForm.stockUnit}
                      onChange={(event) => updateStockUnit(event.target.value as StockUnit)}
                      className={`h-10 ${getSelectClassName()}`}
                    >
                      {stockUnitOptions.map((stockUnit) => (
                        <option key={stockUnit} value={stockUnit}>
                          {formatUnitLabel(stockUnit)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {productForm.stockUnit === "cajas" && (
                    <>
                    <label className={formLabelClassName}>
                      <span>Cantidad de cajas</span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        value={productForm.boxes || ""}
                        onChange={(event) => updateProductForm("boxes", event.target.value)}
                        placeholder="0"
                        className={`h-10 ${getFieldClassName()}`}
                      />
                    </label>

                    <label className={formLabelClassName}>
                      <span>Piezas por caja</span>
                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={productForm.piecesPerBox || ""}
                        onChange={(event) => updateProductForm("piecesPerBox", event.target.value)}
                        placeholder="0"
                        className={`h-10 ${getFieldClassName()}`}
                      />
                    </label>
                    </>
                  )}

                  {productForm.stockUnit === "kilos" && (
                    <label className={formLabelClassName}>
                      <span>Cantidad en kilos</span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.kilos || ""}
                        onChange={(event) => updateProductForm("kilos", event.target.value)}
                        placeholder="0"
                        className={`h-10 ${getFieldClassName()}`}
                      />
                    </label>
                  )}

                  {productForm.stockUnit === "piezas" && (
                    <label className={formLabelClassName}>
                      <span>Piezas disponibles</span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        value={productForm.pieces || ""}
                        onChange={(event) => updateProductForm("pieces", event.target.value)}
                        placeholder="0"
                        className={`h-10 ${getFieldClassName()}`}
                      />
                    </label>
                  )}
                </div>
              </section>

              <div className="mt-4 space-y-1.5 text-sm font-medium text-foreground">
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
                  disabled={hasProductFormErrors}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:pointer-events-none disabled:opacity-50"
                >
                  Guardar y continuar
                </button>
              )}
              <button
                type="submit"
                name="productAction"
                value="save"
                disabled={hasProductFormErrors}
                className={claseBotonPrimario("h-10 px-4 text-sm disabled:pointer-events-none disabled:opacity-50")}
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
