import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Banknote,
  CreditCard,
  FileText,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { ROUTE_PATHS } from "@/config/routePaths";
import {
  customerCartStorageKey,
  customerCartUpdatedEvent,
  customerInvoicesStorageKey,
  productsStorageKey,
} from "@/features/comercializadora/storage";
import { claseBotonPrimario, claseTarjeta, claseTarjetaSuave } from "@/shared/ui/estilosDashboard";

type CatalogProduct = {
  id: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  salePrice: number;
  imageUrl: string;
  stockTotal: number;
  available: number;
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
    category: "Limpieza",
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

const getCustomerSection = (hash: string): CustomerSection => {
  if (hash === "#pedido") {
    return "pedido";
  }

  if (hash === "#checkout") {
    return "checkout";
  }

  if (hash === "#pago") {
    return "pago";
  }

  return "catalogo";
};

const loadCatalogProducts = (): CatalogProduct[] => {
  if (typeof window === "undefined") {
    return fallbackProducts;
  }

  try {
    const storedProducts = window.localStorage.getItem(productsStorageKey);
    const parsedProducts = storedProducts ? (JSON.parse(storedProducts) as CatalogProduct[]) : [];
    const purchasableProducts = parsedProducts.filter(
      (product) => product.available > 0 && product.salePrice > 0,
    );

    return purchasableProducts.length > 0 ? purchasableProducts : fallbackProducts;
  } catch {
    return fallbackProducts;
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

export default function ClienteView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products] = useState<CatalogProduct[]>(loadCatalogProducts);
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCartItems);
  const [invoices, setInvoices] = useState<Invoice[]>(loadInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const activeSection = getCustomerSection(location.hash);

  useEffect(() => {
    window.localStorage.setItem(customerCartStorageKey, JSON.stringify(cartItems));
    notifyCartUpdated();
  }, [cartItems]);

  useEffect(() => {
    window.localStorage.setItem(customerInvoicesStorageKey, JSON.stringify(invoices));
  }, [invoices]);

  const filteredProducts = useMemo(() => {
    const purchasableProducts = products.filter((product) => product.available > 0 && product.salePrice > 0);
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return purchasableProducts;
    }

    return purchasableProducts.filter((product) =>
      [product.name, product.brand, product.category, product.barcode]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
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
  const deliveryFee = cartProducts.length > 0 && subtotal < 500 ? 35 : 0;
  const total = subtotal + deliveryFee;

  const updateQuantity = (productId: string, quantityChange: number) => {
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
    setCartItems([]);
    navigate(`${ROUTE_PATHS.cliente}#pago`);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      {activeSection === "catalogo" && (
        <section className={claseTarjeta("overflow-hidden")}>
          <div className="border-b border-border/70 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Catalogo</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">Productos disponibles</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Solo se muestran productos con existencias y precio de venta activo.
                </p>
              </div>
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Buscar productos"
                  placeholder="Buscar por producto, marca o categoria..."
                  className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>
          </div>

          <div id="catalogo" className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const quantity = cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;

              return (
                <article key={product.id} className={claseTarjetaSuave("flex flex-col overflow-hidden")}>
                  <div className="flex aspect-[4/3] items-center justify-center bg-muted/60">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <PackageCheck className="h-12 w-12 text-primary" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{product.category}</p>
                        <h3 className="mt-1 text-base font-semibold leading-6 text-foreground">{product.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{product.brand || "Sin marca"}</p>
                      </div>
                      <span className="rounded-lg bg-success/10 px-2.5 py-1 text-xs font-semibold text-success ring-1 ring-success/25">
                        Compra
                      </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-foreground">{formatCurrency(product.salePrice)}</p>
                        <p className="text-xs text-muted-foreground">{product.available} disponibles</p>
                      </div>
                      {quantity > 0 ? (
                        <div className="flex items-center rounded-lg border border-border bg-background">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            aria-label={`Restar ${product.name}`}
                            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition hover:text-foreground"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-foreground">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            aria-label={`Agregar ${product.name}`}
                            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition hover:text-foreground"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, 1)}
                          className={claseBotonPrimario("h-10 gap-2 px-3 text-sm")}
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
        </section>
      )}

      {activeSection === "pedido" && (
        <section id="pedido" className={claseTarjeta("mx-auto max-w-3xl overflow-hidden")}>
          <div className="flex items-center justify-between border-b border-border/70 p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Mi pedido</h2>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{cartProducts.length} productos</span>
          </div>

          <div className="p-4">
            {cartProducts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Tu pedido esta vacio. Agrega productos desde el catalogo.
              </div>
            ) : (
              <div className="space-y-3">
                {cartProducts.map((product) => (
                  <div key={product.id} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <PackageCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} x {formatCurrency(product.salePrice)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      aria-label={`Quitar ${product.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-border/70 p-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Envio</span>
              <span>{deliveryFee === 0 ? "Gratis" : formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold text-foreground">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <button
              type="button"
              disabled={cartProducts.length === 0}
              onClick={handlePayOrder}
              className={claseBotonPrimario("mt-4 h-11 w-full gap-2 px-4 text-sm disabled:pointer-events-none disabled:opacity-45")}
            >
              <BadgeCheck className="h-4 w-4" />
              Pagar
            </button>
          </div>
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
                      placeholder="Nombre del titular"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    <span>Numero de tarjeta</span>
                    <input
                      required
                      inputMode="numeric"
                      pattern="[0-9 ]{15,19}"
                      placeholder="4242 4242 4242 4242"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-1.5 text-sm font-medium text-foreground">
                      <span>Vence</span>
                      <input
                        required
                        placeholder="MM/AA"
                        pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                      />
                    </label>
                    <label className="space-y-1.5 text-sm font-medium text-foreground">
                      <span>CVV</span>
                      <input
                        required
                        inputMode="numeric"
                        pattern="[0-9]{3,4}"
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
              <h2 className="text-xl font-semibold text-foreground">Pago</h2>
            </div>
            <p className="text-sm text-muted-foreground">Consulta las facturas generadas por tus pagos.</p>
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

                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(invoice)}
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-muted"
                  >
                    <FileText className="h-4 w-4" />
                    Ver factura
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
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
