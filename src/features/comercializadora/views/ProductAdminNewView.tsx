import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  Boxes,
  ChevronDown,
  PackagePlus,
  Pencil,
  Plus,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { ROUTE_PATHS } from "@/config/routePaths";
import {
  defaultInventoryCatalogs,
  getSubcategoriesByCategoryName,
} from "@/features/comercializadora/catalogs";
import {
  inventorySingleTableStorageKey,
  productsStorageKey,
  productsUpdatedEvent,
} from "@/features/comercializadora/storage";
import { buildVariantName } from "@/features/comercializadora/productVariants";

type PresentationRow = {
  id: string;
  sku: string;
  barcode: string;
  content: string;
  unit: string;
  container: string;
  weight: string;
};

type InventoryRow = {
  id: string;
  warehouse: string;
  sku: string;
  initialStock: string;
  minStock: string;
  maxStock: string;
  location: string;
};

type PriceRow = {
  id: string;
  sku: string;
  minimumQuantity: string;
  unitPrice: string;
  currency: string;
};

type LocalInventoryProduct = {
  id: string;
  barcode: string;
  name: string;
  productLine: string;
  presentation: string;
  category: string;
  subcategory: string;
  brand: string;
  manufacturer: string;
  stockUnit: "piezas";
  boxes: number;
  kilos: number;
  pieces: number;
  piecesPerBox: number;
  minStock: number;
  maxStock?: number;
  purchasePrice: number;
  salePrice: number;
  tipoPrecio: "pieza";
  taxRate: number;
  imageUrl: string;
  stockTotal: number;
  available: number;
  lastMovement: string;
};

type SingleTableItem = Record<string, string | number | boolean | undefined>;

const unitOptions = ["ml", "L", "g", "kg", "pieza"];
const containerOptions = ["Botella PET", "Lata", "Botella vidrio", "Caja", "Bolsa", "Paquete"];
const warehouseOptions = ["MATRIZ", "SUCURSAL NORTE", "SUCURSAL SUR"];
const currencyOptions = ["MXN", "USD"];
const commercialCategories = [
  "Refrescos",
  "Agua",
  "Jugos",
  "Bebidas isotónicas",
  "Energéticas",
  "Pan de caja",
  "Galletas",
  "Botanas",
  "Lácteos",
  "Limpieza General",
];
const adminCardClass = "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm";
const adminFieldClass =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const productPresets = [
  {
    keywords: ["coca", "coca-cola", "coca cola"],
    productName: "Coca-Cola",
    brand: "Coca-Cola",
    category: "Refrescos",
    description: "Bebida carbonatada",
    internalCode: "PROD-0001",
    presentations: [
      { sku: "COC355LAT", barcode: "7501055300011", content: "355", unit: "ml", container: "Lata", weight: "0.355" },
      { sku: "COC600PET", barcode: "7501055300028", content: "600", unit: "ml", container: "Botella PET", weight: "0.600" },
      { sku: "COC2LPET", barcode: "7501055300035", content: "2", unit: "L", container: "Botella PET", weight: "2.000" },
    ],
  },
  {
    keywords: ["ciel", "agua ciel"],
    productName: "Ciel",
    brand: "Ciel",
    category: "Agua",
    description: "Agua purificada embotellada",
    internalCode: "PROD-0002",
    presentations: [
      { sku: "CIE600PET", barcode: "7501055311029", content: "600", unit: "ml", container: "Botella PET", weight: "0.600" },
      { sku: "CIE1LPET", barcode: "7501055311036", content: "1", unit: "L", container: "Botella PET", weight: "1.000" },
      { sku: "CIE5LPET", barcode: "7501055311043", content: "5", unit: "L", container: "Botella PET", weight: "5.000" },
    ],
  },
  {
    keywords: ["bimbo", "pan bimbo"],
    productName: "Pan blanco Bimbo",
    brand: "Bimbo",
    category: "Pan de caja",
    description: "Pan de caja empacado",
    internalCode: "PROD-0003",
    presentations: [
      { sku: "BIM680BLA", barcode: "7501000150011", content: "680", unit: "g", container: "Bolsa", weight: "0.680" },
      { sku: "BIM450BLA", barcode: "7501000150028", content: "450", unit: "g", container: "Bolsa", weight: "0.450" },
    ],
  },
];

const createRowId = () => crypto.randomUUID?.() ?? `row-${Date.now()}-${Math.random()}`;

const normalizeKey = (value: string) =>
  value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();

const getPresentationLabel = (presentation: PresentationRow) =>
  [presentation.content, presentation.unit].filter(Boolean).join(" ").trim();

const emptyPresentation = (overrides?: Partial<PresentationRow>): PresentationRow => ({
  id: createRowId(),
  sku: "",
  barcode: "",
  content: "",
  unit: "ml",
  container: "Botella PET",
  weight: "",
  ...overrides,
});

const emptyInventory = (sku = ""): InventoryRow => ({
  id: createRowId(),
  warehouse: "MATRIZ",
  sku,
  initialStock: "",
  minStock: "50",
  maxStock: "",
  location: "",
});

const emptyPrice = (sku = "", minimumQuantity = "1"): PriceRow => ({
  id: createRowId(),
  sku,
  minimumQuantity,
  unitPrice: "",
  currency: "MXN",
});

const getNumber = (value: string) => Number(value) || 0;

const getStoredArray = <T,>(key: string): T[] => {
  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? (JSON.parse(storedValue) as T[]) : [];
  } catch {
    return [];
  }
};

export default function ProductAdminNewView() {
  const navigate = useNavigate();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const categoryOptions = Array.from(new Set([...commercialCategories, ...defaultInventoryCatalogs.subcategories.map((item) => item.name)]));
  const brandOptions = Array.from(
    new Set([...productPresets.map((preset) => preset.brand), ...defaultInventoryCatalogs.brands.map((item) => item.name)]),
  );
  const [productName, setProductName] = useState("Coca-Cola");
  const [brand, setBrand] = useState("Coca-Cola");
  const [category, setCategory] = useState("Refrescos");
  const [description, setDescription] = useState("Bebida carbonatada");
  const [baseUnit, setBaseUnit] = useState("");
  const [internalCode, setInternalCode] = useState("PROD-0001");
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [presentations, setPresentations] = useState<PresentationRow[]>([
    emptyPresentation({
      sku: "COC355LAT",
      barcode: "7501055300011",
      content: "355",
      unit: "ml",
      container: "Lata",
      weight: "0.355",
    }),
    emptyPresentation({
      sku: "COC600PET",
      barcode: "7501055300028",
      content: "600",
      unit: "ml",
      container: "Botella PET",
      weight: "0.600",
    }),
    emptyPresentation({
      sku: "COC2LPET",
      barcode: "7501055300035",
      content: "2",
      unit: "L",
      container: "Botella PET",
      weight: "2.000",
    }),
  ]);
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([
    { ...emptyInventory("COC355LAT"), initialStock: "320", minStock: "50", maxStock: "800", location: "A-01-03" },
    { ...emptyInventory("COC355LAT"), warehouse: "SUCURSAL NORTE", initialStock: "150", minStock: "30", location: "B-02-01" },
  ]);
  const [priceRows, setPriceRows] = useState<PriceRow[]>([
    { ...emptyPrice("COC355LAT", "1"), unitPrice: "15.00" },
    { ...emptyPrice("COC355LAT", "12"), unitPrice: "13.50" },
    { ...emptyPrice("COC355LAT", "24"), unitPrice: "12.50" },
  ]);
  const [successMessage, setSuccessMessage] = useState("");

  const productKey = normalizeKey(productName || internalCode || "PRODUCTO");
  const selectedSubcategory = getSubcategoriesByCategoryName(category)[0]?.name ?? category;
  const availableSkus = presentations.map((presentation) => presentation.sku).filter(Boolean);

  const singleTableItems = useMemo<SingleTableItem[]>(() => {
    const productPk = `PRODUCTO#${productKey}`;
    const productItem: SingleTableItem = {
      PK: productPk,
      SK: "INFO",
      nombre: productName,
      marca: brand,
      categoria: category,
      descripcion: description,
      activo: isActive,
    };

    const presentationItems = presentations
      .filter((presentation) => presentation.sku || presentation.content)
      .map((presentation) => ({
        PK: productPk,
        SK: `PRESENTACION#${normalizeKey(getPresentationLabel(presentation) || presentation.sku)}`,
        sku: presentation.sku,
        codigoBarras: presentation.barcode,
        contenido: getNumber(presentation.content),
        unidadMedida: presentation.unit,
        envase: presentation.container,
        peso: getNumber(presentation.weight),
      }));

    const inventoryItems = inventoryRows
      .filter((row) => row.sku)
      .map((row) => ({
        PK: `SKU#${normalizeKey(row.sku)}`,
        SK: `INVENTARIO#${normalizeKey(row.warehouse)}`,
        existencia: getNumber(row.initialStock),
        stockMinimo: getNumber(row.minStock),
        stockMaximo: getNumber(row.maxStock),
        ubicacion: row.location,
      }));

    const priceItems = priceRows
      .filter((row) => row.sku)
      .map((row) => ({
        PK: `SKU#${normalizeKey(row.sku)}`,
        SK: `PRECIO#${getNumber(row.minimumQuantity) <= 1 ? "MENUDEO" : `MAYOREO#${row.minimumQuantity}`}`,
        cantidadMinima: getNumber(row.minimumQuantity),
        precio: getNumber(row.unitPrice),
        moneda: row.currency,
      }));

    return [productItem, ...presentationItems, ...inventoryItems, ...priceItems];
  }, [brand, category, description, inventoryRows, isActive, presentations, priceRows, productKey, productName]);

  const updatePresentation = (id: string, field: keyof PresentationRow, value: string) => {
    setPresentations((currentRows) =>
      currentRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const updateProductName = (value: string) => {
    setProductName(value);

    const normalizedValue = normalizeKey(value).toLowerCase();
    const preset = productPresets.find((item) =>
      item.keywords.some((keyword) => normalizedValue.includes(normalizeKey(keyword).toLowerCase())),
    );

    if (!preset) {
      return;
    }

    setProductName(preset.productName);
    setBrand(preset.brand);
    setCategory(preset.category);
    setDescription(preset.description);
    setInternalCode(preset.internalCode);
    setPresentations(preset.presentations.map((presentation) => emptyPresentation(presentation)));
    setInventoryRows([
      { ...emptyInventory(preset.presentations[0]?.sku ?? ""), initialStock: "320", minStock: "50", maxStock: "800", location: "A-01-03" },
      { ...emptyInventory(preset.presentations[0]?.sku ?? ""), warehouse: "SUCURSAL NORTE", initialStock: "150", minStock: "30", location: "B-02-01" },
    ]);
    setPriceRows([
      { ...emptyPrice(preset.presentations[0]?.sku ?? "", "1"), unitPrice: "15.00" },
      { ...emptyPrice(preset.presentations[0]?.sku ?? "", "12"), unitPrice: "13.50" },
      { ...emptyPrice(preset.presentations[0]?.sku ?? "", "24"), unitPrice: "12.50" },
    ]);
  };

  const updateInventory = (id: string, field: keyof InventoryRow, value: string) => {
    setInventoryRows((currentRows) =>
      currentRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const updatePrice = (id: string, field: keyof PriceRow, value: string) => {
    setPriceRows((currentRows) => currentRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addPresentation = () => setPresentations((currentRows) => [...currentRows, emptyPresentation()]);
  const addInventory = () => setInventoryRows((currentRows) => [...currentRows, emptyInventory(availableSkus[0] ?? "")]);
  const addPrice = () => setPriceRows((currentRows) => [...currentRows, emptyPrice(availableSkus[0] ?? "")]);

  const removePresentation = (id: string) => {
    setPresentations((currentRows) => currentRows.filter((row) => row.id !== id));
  };

  const removeInventory = (id: string) => {
    setInventoryRows((currentRows) => currentRows.filter((row) => row.id !== id));
  };

  const removePrice = (id: string) => {
    setPriceRows((currentRows) => currentRows.filter((row) => row.id !== id));
  };

  const updateProductImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const getInventoryForSku = (sku: string) =>
    inventoryRows
      .filter((row) => row.sku === sku)
      .reduce(
        (summary, row) => ({
          stock: summary.stock + getNumber(row.initialStock),
          minStock: summary.minStock + getNumber(row.minStock),
          maxStock: summary.maxStock + getNumber(row.maxStock),
        }),
        { stock: 0, minStock: 0, maxStock: 0 },
      );

  const getSalePriceForSku = (sku: string) => {
    const price = priceRows
      .filter((row) => row.sku === sku)
      .sort((left, right) => getNumber(left.minimumQuantity) - getNumber(right.minimumQuantity))[0];

    return getNumber(price?.unitPrice ?? "");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validPresentations = presentations.filter((presentation) => presentation.sku && presentation.content);

    if (!productName.trim() || !brand.trim() || !category.trim() || validPresentations.length === 0) {
      return;
    }

    const nextProducts = validPresentations.map<LocalInventoryProduct>((presentation) => {
      const inventory = getInventoryForSku(presentation.sku);
      const presentationLabel = getPresentationLabel(presentation);

      return {
        id: presentation.sku,
        barcode: presentation.barcode,
        name: buildVariantName(productName, presentationLabel),
        productLine: productName,
        presentation: presentationLabel,
        category,
        subcategory: selectedSubcategory,
        brand,
        manufacturer: brand,
        stockUnit: "piezas",
        boxes: 0,
        kilos: 0,
        pieces: inventory.stock,
        piecesPerBox: 0,
        minStock: inventory.minStock || 50,
        maxStock: inventory.maxStock,
        purchasePrice: 0,
        salePrice: getSalePriceForSku(presentation.sku),
        tipoPrecio: "pieza",
        taxRate: 16,
        imageUrl,
        stockTotal: inventory.stock,
        available: inventory.stock,
        lastMovement: "Producto creado desde alta administrativa",
      };
    });

    const storedProducts = getStoredArray<LocalInventoryProduct>(productsStorageKey);
    const productsById = new Map(storedProducts.map((product) => [product.id, product]));

    nextProducts.forEach((product) => productsById.set(product.id, product));
    window.localStorage.setItem(productsStorageKey, JSON.stringify(Array.from(productsById.values())));
    window.localStorage.setItem(inventorySingleTableStorageKey, JSON.stringify(singleTableItems));
    window.dispatchEvent(new Event(productsUpdatedEvent));
    setSuccessMessage(`Producto guardado con ${nextProducts.length} presentaciones.`);
    window.setTimeout(() => navigate(ROUTE_PATHS.dashboard), 650);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-[calc(100vh-68px)] w-full flex-col gap-4 bg-[#f6f8fb] p-5 text-slate-900 lg:p-6"
    >
      <header className="flex flex-col gap-4 border-b border-slate-200 bg-[#f6f8fb] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm">
              <PackagePlus className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-bold leading-tight text-slate-950">Agregar nuevo producto</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Registra un nuevo producto con sus presentaciones, inventario y precios.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {successMessage && (
            <span className="inline-flex min-h-10 items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700">
              {successMessage}
            </span>
          )}
          <button
            type="button"
            onClick={() => navigate(ROUTE_PATHS.dashboard)}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            <Save className="h-4 w-4" />
            Guardar producto
          </button>
        </div>
      </header>

      <section className={adminCardClass}>
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-semibold text-blue-700">1. Información general del producto</h3>
        </div>
        <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1.5 text-sm font-semibold text-slate-800">
              <span>Nombre del producto *</span>
              <input
                required
                value={productName}
                onChange={(event) => updateProductName(event.target.value)}
                placeholder="Ej. Coca-Cola"
                className={adminFieldClass}
              />
            </label>

            <label className="space-y-1.5 text-sm font-semibold text-slate-800">
              <span>Marca *</span>
              <input
                required
                list="product-brand-options"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder="Ej. Coca-Cola"
                className={adminFieldClass}
              />
              <datalist id="product-brand-options">
                {brandOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </label>

            <label className="space-y-1.5 text-sm font-semibold text-slate-800">
              <span>Categoría *</span>
              <select
                required
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={adminFieldClass}
              >
                <option value="">Selecciona una categoría</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-semibold text-slate-800 md:col-span-1">
              <span>Descripción</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descripción del producto"
                rows={3}
                className="min-h-20 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="space-y-1.5 text-sm font-semibold text-slate-800">
              <span>Unidad base *</span>
              <select
                required
                value={baseUnit}
                onChange={(event) => setBaseUnit(event.target.value)}
                className={adminFieldClass}
              >
                <option value="">Selecciona unidad</option>
                {unitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-sm font-semibold text-slate-800">
              <span>Código interno</span>
              <input
                value={internalCode}
                onChange={(event) => setInternalCode(event.target.value)}
                placeholder="Ej. PROD-0001"
                className={`${adminFieldClass} font-mono`}
              />
            </label>

            <div className="flex flex-col justify-end gap-2">
              <span className="text-sm font-semibold text-slate-800">Producto activo</span>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => setIsActive((currentValue) => !currentValue)}
                className="flex h-10 items-center gap-3 rounded-md text-left text-sm font-medium text-slate-500 transition"
              >
                <span
                  className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
                    isActive ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full bg-white shadow transition ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
                <span>{isActive ? "Disponible para ventas" : "Pausado"}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
          >
            {imageUrl ? (
              <img src={imageUrl} alt={productName || "Producto"} className="h-full max-h-52 w-full rounded-lg object-cover" />
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-slate-400" />
                <span className="mt-4 text-sm font-medium text-slate-700">Imagen del producto</span>
                <span className="mt-2 text-xs leading-5 text-slate-500">
                  Arrastra una imagen o haz clic para seleccionar
                  <br />
                  PNG, JPG hasta 2MB
                </span>
              </>
            )}
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              onChange={updateProductImage}
              className="hidden"
            />
          </button>
        </div>
      </section>

      <section className={adminCardClass}>
        <SectionTitle
          title="2. Presentaciones"
          actionLabel="Agregar presentación"
          onAction={addPresentation}
        />
        <EditableTable minWidth="1050px">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <TableHeader>SKU</TableHeader>
              <TableHeader>Código de barras</TableHeader>
              <TableHeader>Contenido</TableHeader>
              <TableHeader>Unidad</TableHeader>
              <TableHeader>Envase</TableHeader>
              <TableHeader>Peso (kg)</TableHeader>
              <TableHeader className="text-right">Acciones</TableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {presentations.map((presentation) => (
              <tr key={presentation.id}>
                <TableCell>
                  <TableInput
                    value={presentation.sku}
                    onChange={(value) => updatePresentation(presentation.id, "sku", value)}
                    placeholder="COC600PET"
                  />
                </TableCell>
                <TableCell>
                  <TableInput
                    value={presentation.barcode}
                    onChange={(value) => updatePresentation(presentation.id, "barcode", value.replace(/\D/g, ""))}
                    placeholder="7501055300028"
                  />
                </TableCell>
                <TableCell>
                  <TableInput
                    value={presentation.content}
                    onChange={(value) => updatePresentation(presentation.id, "content", value)}
                    placeholder="600"
                    type="number"
                  />
                </TableCell>
                <TableCell>
                  <TableSelect
                    value={presentation.unit}
                    options={unitOptions}
                    onChange={(value) => updatePresentation(presentation.id, "unit", value)}
                  />
                </TableCell>
                <TableCell>
                  <TableSelect
                    value={presentation.container}
                    options={containerOptions}
                    onChange={(value) => updatePresentation(presentation.id, "container", value)}
                  />
                </TableCell>
                <TableCell>
                  <TableInput
                    value={presentation.weight}
                    onChange={(value) => updatePresentation(presentation.id, "weight", value)}
                    placeholder="0.600"
                    type="number"
                  />
                </TableCell>
                <TableCell>
                  <RowActions onDelete={() => removePresentation(presentation.id)} />
                </TableCell>
              </tr>
            ))}
          </tbody>
        </EditableTable>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={adminCardClass}>
          <SectionTitle
            title="3. Inventario inicial (por almacén)"
            actionLabel="Agregar almacén"
            onAction={addInventory}
          />
          <EditableTable minWidth="760px">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <TableHeader>Almacén</TableHeader>
                <TableHeader>Presentación (SKU)</TableHeader>
                <TableHeader>Existencia inicial</TableHeader>
                <TableHeader>Stock mínimo</TableHeader>
                <TableHeader>Ubicación</TableHeader>
                <TableHeader className="text-right">Acciones</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {inventoryRows.map((row) => (
                <tr key={row.id}>
                  <TableCell>
                    <TableSelect
                      value={row.warehouse}
                      options={warehouseOptions}
                      onChange={(value) => updateInventory(row.id, "warehouse", value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TableSelect
                      value={row.sku}
                      options={availableSkus}
                      onChange={(value) => updateInventory(row.id, "sku", value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TableInput
                      value={row.initialStock}
                      onChange={(value) => updateInventory(row.id, "initialStock", value)}
                      placeholder="320"
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <TableInput
                      value={row.minStock}
                      onChange={(value) => updateInventory(row.id, "minStock", value)}
                      placeholder="50"
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <TableInput
                      value={row.location}
                      onChange={(value) => updateInventory(row.id, "location", value)}
                      placeholder="A-01-03"
                    />
                  </TableCell>
                  <TableCell>
                    <RowActions onDelete={() => removeInventory(row.id)} />
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </EditableTable>
        </section>

        <section className={adminCardClass}>
          <SectionTitle
            title="4. Precios por presentación"
            actionLabel="Agregar precio"
            onAction={addPrice}
          />
          <EditableTable minWidth="760px">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <TableHeader>Presentación (SKU)</TableHeader>
                <TableHeader>Cantidad mínima</TableHeader>
                <TableHeader>Precio unitario</TableHeader>
                <TableHeader>Moneda</TableHeader>
                <TableHeader className="text-right">Acciones</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {priceRows.map((row) => (
                <tr key={row.id}>
                  <TableCell>
                    <TableSelect
                      value={row.sku}
                      options={availableSkus}
                      onChange={(value) => updatePrice(row.id, "sku", value)}
                    />
                  </TableCell>
                  <TableCell>
                    <TableInput
                      value={row.minimumQuantity}
                      onChange={(value) => updatePrice(row.id, "minimumQuantity", value)}
                      placeholder="24"
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <TableInput
                      value={row.unitPrice}
                      onChange={(value) => updatePrice(row.id, "unitPrice", value)}
                      placeholder="12.50"
                      type="number"
                    />
                  </TableCell>
                  <TableCell>
                    <TableSelect
                      value={row.currency}
                      options={currencyOptions}
                      onChange={(value) => updatePrice(row.id, "currency", value)}
                    />
                  </TableCell>
                  <TableCell>
                    <RowActions onDelete={() => removePrice(row.id)} />
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </EditableTable>
        </section>
      </div>

      <details className={adminCardClass}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <span className="flex items-center gap-2 text-base font-semibold text-blue-700">
            <Archive className="h-5 w-5" />
            5. Información adicional (opcional)
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </summary>
        <div className="border-t border-slate-200 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Boxes className="h-4 w-4 text-blue-700" />
            Items generados para DynamoDB
          </div>
          <EditableTable minWidth="900px">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <TableHeader>PK</TableHeader>
                <TableHeader>SK</TableHeader>
                <TableHeader>Datos principales</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {singleTableItems.map((item) => (
                <tr key={`${item.PK}-${item.SK}`}>
                  <TableCell className="font-mono text-xs">{item.PK}</TableCell>
                  <TableCell className="font-mono text-xs">{item.SK}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {Object.entries(item)
                      .filter(([key]) => key !== "PK" && key !== "SK")
                      .slice(0, 4)
                      .map(([key, value]) => `${key}: ${String(value)}`)
                      .join(" | ")}
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </EditableTable>
        </div>
      </details>
    </form>
  );
}

type SectionTitleProps = {
  title: string;
  actionLabel: string;
  onAction: () => void;
};

function SectionTitle({ title, actionLabel, onAction }: SectionTitleProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
      <h3 className="text-base font-semibold text-blue-700">{title}</h3>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
      >
        <Plus className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  );
}

function EditableTable({ children, minWidth }: { children: ReactNode; minWidth: string }) {
  return (
    <div className="overflow-x-auto p-4">
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

function TableHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-2 py-2 font-semibold ${className}`}>{children}</th>;
}

function TableCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-t border-slate-100 px-2 py-2 align-middle text-slate-800 ${className}`}>{children}</td>;
}

type TableInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number";
};

function TableInput({ value, onChange, placeholder, type = "text" }: TableInputProps) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      min={type === "number" ? "0" : undefined}
      step={type === "number" ? "0.001" : undefined}
      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  );
}

type TableSelectProps = {
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function TableSelect({ value, options, onChange }: TableSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      {options.length === 0 && <option value="">Sin opciones</option>}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function RowActions({ onDelete }: { onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-blue-200 bg-white text-blue-600 transition hover:bg-blue-50"
        aria-label="Editar fila"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-200 bg-white text-rose-500 transition hover:bg-rose-50"
        aria-label="Eliminar fila"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
