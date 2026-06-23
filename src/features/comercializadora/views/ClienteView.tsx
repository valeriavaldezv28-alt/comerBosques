import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Banknote,
  CreditCard,
  Eye,
  FileText,
  LayoutGrid,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { ROUTE_PATHS } from "@/config/routePaths";
import {
  customerCartStorageKey,
  customerCartUpdatedEvent,
  customerInvoicesStorageKey,
  productsStorageKey,
  productsUpdatedEvent,
} from "@/features/comercializadora/storage";
import {
  fetchProducts,
  updateProduct as apiUpdateProduct,
} from "@/features/comercializadora/productsApi";
import { claseBotonPrimario, claseTarjeta, claseTarjetaSuave } from "@/shared/ui/estilosDashboard";

type CatalogProduct = {
  id: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  stockUnit?: "cajas" | "kilos";
  boxes?: number;
  kilos?: number;
  salePrice: number;
  imageUrl: string;
  stockTotal: number;
  available: number;
  lastMovement?: string;
};

type CartItem = {
  productId: string;
  quantity: number;
};

type PaymentMethod = "efectivo" | "tarjeta";

type Invoice = {
  id: string;
  date: string;
  items: Array<{
    productId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: "Pagada" | "Contra entrega";
};

type CustomerSection = "catalogo" | "pedido" | "checkout" | "pago";
type AvailabilityFilter = "all" | "available" | "low";

const FREE_SHIPPING_THRESHOLD = 500;
const allCategoriesLabel = "Todos los departamentos";
const cleaningAndHomeLabel = "Limpieza y Hogar";
const departmentOptions = [
  "Despensa",
  "Lácteos y Huevo",
  "Botanas, Dulces y Galletas",
  "Granel",
  cleaningAndHomeLabel,
  "Higiene Personal y Belleza",
  "Bebidas",
  "Cervezas, Vinos y Licores",
  "Farmacia y Bienestar",
];
const cleaningAndHomeSubcategories = [
  "Hogar",
  "Papel Higiénico y Pañuelos",
  "Lavandería",
  "Desechables",
  "Limpieza General",
];

const fallbackProducts: CatalogProduct[] = [
  {
    id: "DEMO-001",
    barcode: "7501023501128",
    name: "Aceite vegetal 1 L",
    category: "Aceites",
    brand: "Nutrioli",
    salePrice: 38.9,
    imageUrl: "",
    stockTotal: 36,
    available: 36,
  },
  {
    id: "DEMO-002",
    barcode: "7501055300072",
    name: "Refresco cola 600 ml",
    category: "Bebidas",
    brand: "Coca-Cola",
    salePrice: 18,
    imageUrl: "",
    stockTotal: 72,
    available: 72,
  },
  {
    id: "DEMO-003",
    barcode: "7501035910017",
    name: "Limpiador multiusos 1 L",
    category: cleaningAndHomeLabel,
    brand: "Fabuloso",
    salePrice: 31,
    imageUrl: "",
    stockTotal: 24,
    available: 24,
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));

const getPaymentMethodLabel = (paymentMethod?: PaymentMethod) => {
  if (paymentMethod === "efectivo") {
    return "Efectivo contra entrega";
  }

  if (paymentMethod === "tarjeta") {
    return "Tarjeta";
  }

  return "No registrado";
};

const getInvoiceStatusClassName = (status: Invoice["status"]) => {
  if (status === "Pagada") {
    return "bg-success/10 text-success ring-success/25";
  }

  return "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300";
};

const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

const formatExpiryDate = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const formatSecurityCode = (value: string) => value.replace(/\D/g, "").slice(0, 4);

const getCustomerSection = (hash: string): CustomerSection => {
  if (hash === "#pedido") {
    return "catalogo";
  }

  if (hash === "#checkout") {
    return "checkout";
  }

  if (hash === "#pago") {
    return "pago";
  }

  return "catalogo";
};

const getStockIndicator = (available: number) => {
  if (available <= 0) {
    return {
      label: "Agotado",
      className: "bg-destructive/10 text-destructive ring-destructive/25",
      dotClassName: "bg-destructive",
    };
  }

  if (available < 5) {
    return {
      label: "Casi agotado",
      className: "bg-destructive/10 text-destructive ring-destructive/25",
      dotClassName: "bg-destructive",
    };
  }

  if (available <= 20) {
    return {
      label: "Ultimas piezas",
      className: "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300",
      dotClassName: "bg-amber-500",
    };
  }

  return {
    label: "Disponible",
    className: "bg-success/10 text-success ring-success/25",
    dotClassName: "bg-success",
  };
};

const getProductPresentation = (product: CatalogProduct) => {
  const match = product.name.match(/\b\d+(?:[.,]\d+)?\s?(?:ml|l|kg|g|pz|pzas|piezas)\b/i);
  return match?.[0] ?? "Presentacion comercial";
};

const getSaleUnit = (product: CatalogProduct) => {
  if (product.stockUnit === "kilos") {
    return "Kilo";
  }

  if (product.stockUnit === "cajas") {
    return "Caja";
  }

  return "Pieza";
};

const getCategoryOptions = (products: CatalogProduct[]) => {
  const requestedCategories = [allCategoriesLabel, ...departmentOptions];
  const productCategories = Array.from(new Set(products.map((product) => product.category).filter(Boolean)));
  return [...requestedCategories, ...productCategories.filter((category) => !requestedCategories.includes(category))];
};

const normalizeCatalogProduct = (product: CatalogProduct): CatalogProduct => ({
  ...product,
  category: product.category === "Limpieza" ? cleaningAndHomeLabel : product.category,
});

const loadCatalogProducts = (): CatalogProduct[] => {
  if (typeof window === "undefined") {
    return fallbackProducts.map(normalizeCatalogProduct);
  }

  try {
    const storedProducts = window.localStorage.getItem(productsStorageKey);
    const parsedProducts = storedProducts ? (JSON.parse(storedProducts) as CatalogProduct[]) : [];
    return (storedProducts ? parsedProducts : fallbackProducts).map(normalizeCatalogProduct);
  } catch {
    return fallbackProducts.map(normalizeCatalogProduct);
  }
};

const loadCartItems = (): CartItem[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedCart = window.localStorage.getItem(customerCartStorageKey);
    return storedCart ? (JSON.parse(storedCart) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const loadInvoices = (): Invoice[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedInvoices = window.localStorage.getItem(customerInvoicesStorageKey);
    return storedInvoices ? (JSON.parse(storedInvoices) as Invoice[]) : [];
  } catch {
    return [];
  }
};

const notifyCartUpdated = () => {
  window.dispatchEvent(new Event(customerCartUpdatedEvent));
};

const notifyProductsUpdated = () => {
  window.dispatchEvent(new Event(productsUpdatedEvent));
};

export default function ClienteView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<CatalogProduct[]>(loadCatalogProducts);
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCartItems);
  const [invoices, setInvoices] = useState<Invoice[]>(loadInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [catalogToolbarTarget, setCatalogToolbarTarget] = useState<HTMLElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(allCategoriesLabel);
  const [selectedBrand, setSelectedBrand] = useState("Todas las marcas");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("all");
  const [maxPrice, setMaxPrice] = useState(1000);
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(false);
  const [activeDepartmentSubmenu, setActiveDepartmentSubmenu] = useState<string | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(location.hash === "#pedido");
  const [animatedCart, setAnimatedCart] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardSecurityCode, setCardSecurityCode] = useState("");
  const departmentsMenuRef = useRef<HTMLDivElement>(null);
  const activeSection = getCustomerSection(location.hash);

  useEffect(() => {
    setCatalogToolbarTarget(document.getElementById("customer-catalog-toolbar"));
  }, []);

  useEffect(() => {
    if (location.hash === "#pedido") {
      setIsCartDrawerOpen(true);
    }
  }, [location.hash]);

  useEffect(() => {
    fetchProducts()
      .then((items) => {
        if (items.length > 0) {
          setProducts((items as CatalogProduct[]).map(normalizeCatalogProduct));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    window.localStorage.setItem(customerCartStorageKey, JSON.stringify(cartItems));
    notifyCartUpdated();
  }, [cartItems]);

  useEffect(() => {
    window.localStorage.setItem(customerInvoicesStorageKey, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    window.localStorage.setItem(productsStorageKey, JSON.stringify(products));
    notifyProductsUpdated();
  }, [products]);

  useEffect(() => {
    if (!isDepartmentsOpen) {
      setActiveDepartmentSubmenu(null);
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (!departmentsMenuRef.current?.contains(event.target as Node)) {
        setIsDepartmentsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDepartmentsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDepartmentsOpen]);

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setIsDepartmentsOpen(false);
  };

  const highestPrice = useMemo(
    () => Math.max(100, Math.ceil(Math.max(...products.map((product) => product.salePrice), 100) / 50) * 50),
    [products],
  );

  useEffect(() => {
    setMaxPrice(highestPrice);
  }, [highestPrice]);

  const categoryOptions = useMemo(() => getCategoryOptions(products), [products]);
  const brandOptions = useMemo(
    () => ["Todas las marcas", ...Array.from(new Set(products.map((product) => product.brand).filter(Boolean))).sort()],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const purchasableProducts = products.filter((product) => product.salePrice > 0);
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return purchasableProducts.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        [product.name, product.brand, product.category, product.barcode, product.id]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
      const matchesCategory = selectedCategory === allCategoriesLabel || product.category === selectedCategory;
      const matchesBrand = selectedBrand === "Todas las marcas" || product.brand === selectedBrand;
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && product.available > 20) ||
        (availabilityFilter === "low" && product.available > 0 && product.available <= 20);
      const matchesPrice = product.salePrice <= maxPrice;

      return matchesSearch && matchesCategory && matchesBrand && matchesAvailability && matchesPrice;
    });
  }, [availabilityFilter, maxPrice, products, searchTerm, selectedBrand, selectedCategory]);

  const searchSuggestions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (normalizedSearch.length < 2) {
      return [];
    }

    return products
      .filter((product) =>
        [product.name, product.brand, product.category, product.barcode, product.id]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      )
      .slice(0, 5);
  }, [products, searchTerm]);

  const cartProducts = useMemo(
    () =>
      cartItems
        .map((item) => {
          const product = products.find((currentProduct) => currentProduct.id === item.productId);
          return product ? { ...product, quantity: item.quantity } : null;
        })
        .filter((item): item is CatalogProduct & { quantity: number } => Boolean(item)),
    [cartItems, products],
  );

  const subtotal = cartProducts.reduce((total, product) => total + product.salePrice * product.quantity, 0);
  const deliveryFee = cartProducts.length > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? 35 : 0;
  const total = subtotal + deliveryFee;
  const cartTotalItems = cartProducts.reduce((itemTotal, product) => itemTotal + product.quantity, 0);
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const updateQuantity = (productId: string, quantityChange: number) => {
    if (quantityChange > 0) {
      setAnimatedCart(true);
      window.setTimeout(() => setAnimatedCart(false), 380);
    }

    setCartItems((currentItems) => {
      const product = products.find((currentProduct) => currentProduct.id === productId);

      if (!product || product.available <= 0 || product.salePrice <= 0) {
        return currentItems;
      }

      const existingItem = currentItems.find((item) => item.productId === productId);
      const nextQuantity = Math.min(product.available, Math.max(0, (existingItem?.quantity ?? 0) + quantityChange));

      if (nextQuantity === 0) {
        return currentItems.filter((item) => item.productId !== productId);
      }

      if (existingItem) {
        return currentItems.map((item) =>
          item.productId === productId ? { ...item, quantity: nextQuantity } : item,
        );
      }

      return [...currentItems, { productId, quantity: nextQuantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
  };

  const handlePayOrder = () => {
    if (cartProducts.length === 0) {
      return;
    }

    setIsCartDrawerOpen(false);
    navigate(`${ROUTE_PATHS.cliente}#checkout`);
  };

  const handleConfirmPayment = () => {
    if (cartProducts.length === 0) {
      return;
    }

    const nextInvoice: Invoice = {
      id: `FAC-${String(invoices.length + 1).padStart(5, "0")}`,
      date: new Date().toISOString(),
      items: cartProducts.map((product) => ({
        productId: product.id,
        name: product.name,
        quantity: product.quantity,
        unitPrice: product.salePrice,
      })),
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      status: paymentMethod === "tarjeta" ? "Pagada" : "Contra entrega",
    };

    setInvoices((currentInvoices) => [nextInvoice, ...currentInvoices]);

    const updatedProducts = products.map((product) => {
      const purchasedProduct = cartProducts.find((cartProduct) => cartProduct.id === product.id);

      if (!purchasedProduct) {
        return product;
      }

      const nextAvailable = Math.max(0, product.available - purchasedProduct.quantity);
      const nextStockTotal = Math.max(0, product.stockTotal - purchasedProduct.quantity);

      return {
        ...product,
        boxes: product.stockUnit === "cajas" ? nextStockTotal : product.boxes,
        kilos: product.stockUnit === "kilos" ? nextStockTotal : product.kilos,
        stockTotal: nextStockTotal,
        available: nextAvailable,
        lastMovement: `Compra cliente: -${purchasedProduct.quantity}`,
      };
    });

    setProducts(updatedProducts);
    updatedProducts
      .filter((p) => cartProducts.some((cp) => cp.id === p.id))
      .forEach((p) => apiUpdateProduct(p.id, p as unknown as Record<string, unknown>).catch(() => {}));
    setCartItems([]);
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardSecurityCode("");
    navigate(`${ROUTE_PATHS.cliente}#pago`);
  };

  const handleBuyAgain = (invoice: Invoice) => {
    const rebuiltItems = invoice.items
      .map((item) => {
        const product = products.find(
          (currentProduct) =>
            currentProduct.id === item.productId ||
            currentProduct.name.toLowerCase() === item.name.toLowerCase(),
        );

        if (!product || product.available <= 0 || product.salePrice <= 0) {
          return null;
        }

        return {
          productId: product.id,
          quantity: Math.min(product.available, item.quantity),
        };
      })
      .filter((item): item is CartItem => Boolean(item));

    setCartItems(rebuiltItems);
    setIsCartDrawerOpen(true);
    navigate(ROUTE_PATHS.cliente);
  };

  const departmentsToolbar = (
    <div className="relative z-30 flex w-full max-w-80 rounded-lg border border-border/60 bg-card px-3 py-3 shadow-sm">
      <div ref={departmentsMenuRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsDepartmentsOpen((isOpen) => !isOpen);
            setActiveDepartmentSubmenu(null);
          }}
          aria-expanded={isDepartmentsOpen}
          aria-haspopup="menu"
          className="flex h-12 w-full items-center gap-3 rounded-lg border-l-2 border-primary/20 bg-card px-3 text-left text-base font-semibold text-foreground transition hover:bg-muted/60 md:w-64"
        >
          <LayoutGrid className="h-6 w-6 shrink-0 text-foreground" />
          <span className="truncate">Departamentos</span>
        </button>

        {isDepartmentsOpen && (
          <div
            role="menu"
            className="absolute left-0 top-full z-[60] mt-2 max-h-[min(32rem,calc(100vh-13rem))] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-border/70 bg-popover shadow-2xl md:mt-3 md:w-[31rem]"
          >
            <div className="py-3 md:py-5">
              {activeDepartmentSubmenu === cleaningAndHomeLabel ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setActiveDepartmentSubmenu(null)}
                    className="block w-full px-5 py-2.5 text-left text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground transition hover:bg-muted/60 md:px-10"
                  >
                    Departamentos
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => selectCategory(cleaningAndHomeLabel)}
                    className={`block w-full px-5 py-2.5 text-left text-base font-semibold italic transition hover:bg-muted/60 md:px-10 md:text-lg ${
                      selectedCategory === cleaningAndHomeLabel ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    Ver todos
                  </button>
                  {cleaningAndHomeSubcategories.map((subcategory) => (
                    <button
                      key={subcategory}
                      type="button"
                      role="menuitem"
                      onClick={() => selectCategory(subcategory)}
                      className={`block w-full px-5 py-2.5 text-left text-base font-medium transition hover:bg-muted/60 md:px-10 md:text-lg ${
                        selectedCategory === subcategory ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {subcategory}
                    </button>
                  ))}
                </>
              ) : (
                categoryOptions.map((category, index) => {
                  const isCleaningDepartment = category === cleaningAndHomeLabel;
                  const isSelected =
                    selectedCategory === category ||
                    (isCleaningDepartment && cleaningAndHomeSubcategories.includes(selectedCategory));

                  return (
                    <button
                      key={category}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        if (isCleaningDepartment) {
                          setActiveDepartmentSubmenu(category);
                          return;
                        }

                        selectCategory(category);
                      }}
                      className={`block w-full px-5 py-2.5 text-left text-base font-medium transition hover:bg-muted/60 md:px-10 md:text-lg ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      } ${index === 0 ? "mb-4 text-base" : ""}`}
                    >
                      {category}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      {catalogToolbarTarget ? createPortal(departmentsToolbar, catalogToolbarTarget) : null}
      {activeSection === "catalogo" && (
        <section className="space-y-4">
          <div className={claseTarjeta("overflow-visible")}>
            <div className="grid gap-4 border-b border-border/70 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Catalogo</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">Hola Cliente</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Productos agregados: {cartTotalItems} | Total actual: {formatCurrency(subtotal)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-foreground">
                    {freeShippingRemaining > 0
                      ? `Te faltan ${formatCurrency(freeShippingRemaining)} para obtener envio gratis`
                      : "Has desbloqueado envio gratis"}
                  </span>
                  <Truck className="h-5 w-5 shrink-0 text-primary" />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="relative w-full lg:max-w-3xl">
                <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-foreground/75" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Buscar productos"
                  placeholder="Busca productos"
                  className="h-12 w-full rounded-full border border-transparent bg-muted/45 pl-14 pr-4 text-base outline-none transition placeholder:text-muted-foreground focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-ring/20"
                />
                {searchSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-14 z-40 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
                    {searchSuggestions.map((product) => (
                      <button
                        key={`suggestion-${product.id}`}
                        type="button"
                        onClick={() => setSearchTerm(product.name)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-muted"
                      >
                        <span className="min-w-0 truncate font-medium text-foreground">{product.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{product.brand || product.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-3 rounded-lg border border-border bg-muted/25 p-3 lg:grid-cols-3">
                <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <span>Marca</span>
                  <select
                    value={selectedBrand}
                    onChange={(event) => setSelectedBrand(event.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                  >
                    {brandOptions.map((brand) => (
                      <option key={brand}>{brand}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <span>Disponibilidad</span>
                  <select
                    value={availabilityFilter}
                    onChange={(event) => setAvailabilityFilter(event.target.value as AvailabilityFilter)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium normal-case tracking-normal text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
                  >
                    <option value="all">Todas</option>
                    <option value="available">Disponible</option>
                    <option value="low">Ultimas piezas</option>
                  </select>
                </label>

                <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <span>Precio hasta {formatCurrency(maxPrice)}</span>
                  <input
                    type="range"
                    min={0}
                    max={highestPrice}
                    step={10}
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(Number(event.target.value))}
                    className="h-10 w-full accent-primary"
                  />
                </label>
              </div>
            </div>
          </div>

          <div id="catalogo" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const quantity = cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;
              const stockIndicator = getStockIndicator(product.available);
              const isBestSeller = product.stockTotal >= 60;
              const isOffer = product.salePrice < 30;

              return (
                <article
                  key={product.id}
                  className={claseTarjetaSuave("flex min-h-[420px] flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-xl")}
                >
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(product)}
                    className="group relative flex aspect-[4/3] items-center justify-center bg-muted/60"
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <PackageCheck className="h-12 w-12 text-primary" />
                    )}
                    <span className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-background/90 text-muted-foreground opacity-0 shadow transition group-hover:opacity-100">
                      <Eye className="h-4 w-4" />
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col p-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {isBestSeller && (
                        <span className="rounded-lg bg-info/10 px-2 py-0.5 text-[11px] font-semibold text-info ring-1 ring-info/20">
                          Mas vendido
                        </span>
                      )}
                      {isOffer && (
                        <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
                          Oferta
                        </span>
                      )}
                    </div>
                    <button type="button" onClick={() => setQuickViewProduct(product)} className="mt-2 text-left">
                      <p className="text-xs font-medium text-muted-foreground">{product.category}</p>
                      <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-foreground">
                        {product.name}
                      </h3>
                    </button>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>SKU: {product.barcode || product.id}</p>
                      <p>Marca: {product.brand || "Sin marca"}</p>
                      <p>
                        {getProductPresentation(product)} | Unidad: {getSaleUnit(product)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${stockIndicator.className}`}>
                        <span className={`h-2 w-2 rounded-full ${stockIndicator.dotClassName}`} />
                        {stockIndicator.label}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">{product.available} disp.</span>
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <p className="text-xl font-bold text-foreground">{formatCurrency(product.salePrice)}</p>
                      {quantity > 0 ? (
                        <div className="flex h-10 items-center rounded-lg border border-border bg-background">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            aria-label={`Restar ${product.name}`}
                            className="flex h-10 w-9 items-center justify-center text-muted-foreground transition hover:text-foreground"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-foreground">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            aria-label={`Agregar ${product.name}`}
                            className="flex h-10 w-9 items-center justify-center text-muted-foreground transition hover:text-foreground"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={product.available <= 0}
                          onClick={() => updateQuantity(product.id, 1)}
                          className={claseBotonPrimario("h-10 gap-2 px-3 text-sm disabled:pointer-events-none disabled:opacity-45")}
                        >
                          <Plus className="h-4 w-4" />
                          Agregar
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No encontramos productos con esos filtros.
            </div>
          )}
        </section>
      )}

      {activeSection === "checkout" && (
        <form
          id="checkout"
          onSubmit={(event) => {
            event.preventDefault();
            handleConfirmPayment();
          }}
          className={claseTarjeta("mx-auto max-w-4xl overflow-hidden")}
        >
          <div className="border-b border-border/70 p-4 sm:p-5">
            <h2 className="text-xl font-semibold text-foreground">Opciones de pago</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Elige como quieres pagar tu pedido antes de generar la factura.
            </p>
          </div>

          <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("efectivo")}
                  className={`flex min-h-24 flex-col items-start justify-center rounded-lg border p-4 text-left transition ${
                    paymentMethod === "efectivo"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Banknote className="h-5 w-5" />
                  <span className="mt-2 text-sm font-semibold">Efectivo contra entrega</span>
                  <span className="text-xs">Paga al recibir tu pedido.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("tarjeta")}
                  className={`flex min-h-24 flex-col items-start justify-center rounded-lg border p-4 text-left transition ${
                    paymentMethod === "tarjeta"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="mt-2 text-sm font-semibold">Tarjeta</span>
                  <span className="text-xs">Captura los datos de tu tarjeta.</span>
                </button>
              </div>

              <label className="space-y-1.5 text-sm font-medium text-foreground">
                <span>Direccion de entrega</span>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    name="shipping street-address"
                    autoComplete="shipping street-address"
                    placeholder="Calle, numero, colonia"
                    className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </label>

              {paymentMethod === "tarjeta" ? (
                <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Nombre en tarjeta</span>
                    <input
                      required
                      name="cc-name"
                      autoComplete="cc-name"
                      value={cardName}
                      onChange={(event) => setCardName(event.target.value)}
                      placeholder="Nombre del titular"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Numero de tarjeta</span>
                    <input
                      required
                      name="cc-number"
                      autoComplete="cc-number"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                      pattern="[0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4}"
                      maxLength={19}
                      placeholder="4242 4242 4242 4242"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5 text-sm font-medium text-foreground">
                      <span>Vence</span>
                      <input
                        required
                        name="cc-exp"
                        autoComplete="cc-exp"
                        inputMode="numeric"
                        value={cardExpiry}
                        onChange={(event) => setCardExpiry(formatExpiryDate(event.target.value))}
                        placeholder="MM/AA"
                        pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                        maxLength={5}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                      />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium text-foreground">
                      <span>CVV</span>
                      <input
                        required
                        name="cc-csc"
                        autoComplete="cc-csc"
                        inputMode="numeric"
                        value={cardSecurityCode}
                        onChange={(event) => setCardSecurityCode(formatSecurityCode(event.target.value))}
                        pattern="[0-9]{3,4}"
                        maxLength={4}
                        placeholder="123"
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                  El repartidor confirmara el total y recibira el efectivo cuando entregue el pedido.
                </div>
              )}
            </div>

            <aside className="rounded-lg border border-border bg-background p-4">
              <h3 className="text-sm font-semibold text-foreground">Resumen</h3>
              <div className="mt-4 space-y-3">
                {cartProducts.map((product) => (
                  <div key={product.id} className="flex justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground">
                      {product.quantity} x {product.name}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(product.quantity * product.salePrice)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-border/70 pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Envio</span>
                  <span>{deliveryFee === 0 ? "Gratis" : formatCurrency(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              <button
                type="submit"
                className={claseBotonPrimario("mt-4 h-11 w-full gap-2 px-4 text-sm")}
              >
                <BadgeCheck className="h-4 w-4" />
                {paymentMethod === "tarjeta" ? "Confirmar pago" : "Confirmar pedido"}
              </button>
            </aside>
          </div>
        </form>
      )}

      {activeSection === "pago" && (
        <section id="pago" className={claseTarjeta("overflow-hidden")}>
          <div className="flex flex-col gap-2 border-b border-border/70 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Mis compras</h2>
            </div>
            <p className="text-sm text-muted-foreground">Consulta pedidos anteriores y repite compras frecuentes.</p>
          </div>

          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2 xl:grid-cols-3">
            {invoices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground lg:col-span-2 xl:col-span-3">
                Todavia no tienes facturas de pago.
              </div>
            ) : (
              invoices.map((invoice) => (
                <article key={invoice.id} className={claseTarjetaSuave("p-4")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold text-foreground">{invoice.id}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(invoice.date)}</p>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${getInvoiceStatusClassName(invoice.status)}`}
                    >
                      {invoice.status}
                    </span>
                  </div>

                  <div className="mt-4 flex justify-between text-base font-semibold text-foreground">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>Metodo</span>
                    <span>{getPaymentMethodLabel(invoice.paymentMethod)}</span>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleBuyAgain(invoice)}
                      className={claseBotonPrimario("h-10 gap-2 px-3 text-sm")}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Comprar nuevamente
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(invoice)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-muted"
                    >
                      <FileText className="h-4 w-4" />
                      Ver factura
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {activeSection === "catalogo" && (
        <button
          type="button"
          onClick={() => setIsCartDrawerOpen(true)}
          className={`fixed bottom-5 right-5 z-40 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-primary/25 bg-card p-3 text-left shadow-2xl transition duration-300 hover:-translate-y-0.5 ${
            animatedCart ? "scale-105 ring-4 ring-primary/20" : "scale-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <ShoppingCart className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{cartTotalItems} productos</span>
              <span className="block text-lg font-bold text-foreground">{formatCurrency(subtotal)}</span>
            </span>
          </div>
          <span className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground">
            Ver pedido
          </span>
        </button>
      )}

      <div className={`fixed inset-0 z-50 ${isCartDrawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          type="button"
          onClick={() => setIsCartDrawerOpen(false)}
          aria-label="Cerrar pedido"
          className={`absolute inset-0 bg-black/35 transition-opacity ${isCartDrawerOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ${
            isCartDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Pedido</p>
              <h2 className="text-lg font-semibold text-foreground">Carrito lateral</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(false)}
              aria-label="Cerrar carrito"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cartProducts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Tu pedido esta vacio. Agrega productos desde el catalogo.
              </div>
            ) : (
              <div className="space-y-3">
                {cartProducts.map((product) => (
                  <div key={product.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="flex gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <PackageCheck className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(product.salePrice)} | {product.available} disponibles
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        aria-label={`Quitar ${product.name}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex h-10 items-center rounded-lg border border-border bg-card">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, -1)}
                          aria-label={`Restar ${product.name}`}
                          className="flex h-10 w-10 items-center justify-center text-muted-foreground transition hover:text-foreground"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold text-foreground">{product.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, 1)}
                          aria-label={`Agregar ${product.name}`}
                          className="flex h-10 w-10 items-center justify-center text-muted-foreground transition hover:text-foreground"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(product.quantity * product.salePrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border/70 p-4">
            <div className="mb-4 rounded-lg border border-border bg-muted/25 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">
                  {freeShippingRemaining > 0
                    ? `Te faltan ${formatCurrency(freeShippingRemaining)} para envio gratis`
                    : "Envio gratis desbloqueado"}
                </span>
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${freeShippingProgress}%` }} />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Envio</span>
                <span>{deliveryFee === 0 ? "Gratis" : formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between pt-2 text-lg font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <button
              type="button"
              disabled={cartProducts.length === 0}
              onClick={handlePayOrder}
              className={claseBotonPrimario("mt-4 h-11 w-full gap-2 px-4 text-sm disabled:pointer-events-none disabled:opacity-45")}
            >
              <BadgeCheck className="h-4 w-4" />
              Finalizar compra
            </button>
          </div>
        </aside>
      </div>

      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 p-4">
              <h3 className="text-lg font-semibold text-foreground">Vista rapida</h3>
              <button
                type="button"
                onClick={() => setQuickViewProduct(null)}
                aria-label="Cerrar producto"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-[280px_minmax(0,1fr)]">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted/60">
                {quickViewProduct.imageUrl ? (
                  <img src={quickViewProduct.imageUrl} alt={quickViewProduct.name} className="h-full w-full object-cover" />
                ) : (
                  <PackageCheck className="h-16 w-16 text-primary" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
                    {quickViewProduct.category}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${getStockIndicator(quickViewProduct.available).className}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${getStockIndicator(quickViewProduct.available).dotClassName}`} />
                    {getStockIndicator(quickViewProduct.available).label}
                  </span>
                </div>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">{quickViewProduct.name}</h3>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>Marca: {quickViewProduct.brand || "Sin marca"}</p>
                  <p>SKU: {quickViewProduct.barcode || quickViewProduct.id}</p>
                  <p>Existencia: {quickViewProduct.available}</p>
                  <p>Unidad: {getSaleUnit(quickViewProduct)}</p>
                  <p className="sm:col-span-2">Presentacion: {getProductPresentation(quickViewProduct)}</p>
                </div>
                <p className="mt-5 text-3xl font-bold text-foreground">{formatCurrency(quickViewProduct.salePrice)}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <div className="flex h-11 items-center rounded-lg border border-border bg-background">
                    <button
                      type="button"
                      onClick={() => updateQuantity(quickViewProduct.id, -1)}
                      aria-label={`Restar ${quickViewProduct.name}`}
                      className="flex h-11 w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-semibold text-foreground">
                      {cartItems.find((item) => item.productId === quickViewProduct.id)?.quantity ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(quickViewProduct.id, 1)}
                      aria-label={`Agregar ${quickViewProduct.name}`}
                      className="flex h-11 w-11 items-center justify-center text-muted-foreground transition hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={quickViewProduct.available <= 0}
                    onClick={() => updateQuantity(quickViewProduct.id, 1)}
                    className={claseBotonPrimario("h-11 gap-2 px-4 text-sm disabled:pointer-events-none disabled:opacity-45")}
                  >
                    <Sparkles className="h-4 w-4" />
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div
            data-print-invoice="true"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Informacion del pago</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Factura {selectedInvoice.id} generada el {formatDate(selectedInvoice.date)}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                aria-label="Cerrar factura"
                data-print-hidden="true"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 rounded-lg bg-muted/35 p-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Estado</p>
                <p className="mt-1 font-semibold text-foreground">{selectedInvoice.status}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total</p>
                <p className="mt-1 font-semibold text-foreground">{formatCurrency(selectedInvoice.total)}</p>
              </div>
              {selectedInvoice.paymentMethod === "tarjeta" ? (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Metodo</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {getPaymentMethodLabel(selectedInvoice.paymentMethod)}
                  </p>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Condicion</p>
                  <p className="mt-1 font-semibold text-foreground">
                    El pago se realizara en efectivo al recibir el pedido.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Productos</h4>
              {selectedInvoice.items.map((item) => (
                <div key={`${selectedInvoice.id}-${item.name}`} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {item.quantity} x {item.name}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-border/70 pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedInvoice.subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>Envio</span>
                <span>{selectedInvoice.deliveryFee === 0 ? "Gratis" : formatCurrency(selectedInvoice.deliveryFee)}</span>
              </div>
              <div className="mt-2 flex justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(selectedInvoice.total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              data-print-hidden="true"
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/10"
            >
              <Printer className="h-4 w-4" />
              Imprimir su factura
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
