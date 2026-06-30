import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ChevronDown,
  Droplets,
  Eye,
  Heart,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Minus,
  Package,
  PackageCheck,
  Phone,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  Truck,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import {
  customerCartStorageKey,
  customerCartUpdatedEvent,
  customerInvoicesStorageKey,
  productsStorageKey,
} from "@/features/comercializadora/storage";
import {
  getProductLine,
  getProductPresentation,
} from "@/features/comercializadora/productVariants";

// ─── Types ────────────────────────────────────────────────────────────────────

type CatalogProduct = {
  id: string;
  barcode?: string;
  name: string;
  productLine?: string;
  presentation?: string;
  category: string;
  brand: string;
  stockUnit?: "cajas" | "kilos" | "piezas";
  piecesPerBox?: number;
  salePrice: number;
  tipoPrecio?: "pieza" | "caja" | "kilo";
  imageUrl: string;
  stockTotal: number;
  available: number;
};

type CartItem = { productId: string; quantity: number };
type AuthUser = { name: string; email: string };
type AuthTab = "login" | "register";

// ─── Constants ────────────────────────────────────────────────────────────────

const AUTH_KEY = "comercializadora-bosques-auth-user";
const ALL_CATS = "Todos los productos";
const IVA_RATE = 0.16;
const FREE_SHIPPING_MIN = 500;

const CATEGORY_CONFIG = [
  { name: "Bebidas", icon: Droplets, bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", desc: "Refrescos, agua, jugos" },
  { name: "Despensa", icon: Boxes, bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", desc: "Abarrotes y básicos" },
  { name: "Limpieza", icon: Sparkles, bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", desc: "Hogar y limpieza" },
  { name: "Lácteos", icon: Package, bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200", desc: "Leche, queso y más" },
  { name: "Botanas", icon: Star, bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", desc: "Dulces y galletas" },
  { name: "Higiene", icon: Heart, bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200", desc: "Cuidado personal" },
] as const;

const PROMOS = [
  { label: "Envío gratis", desc: "En pedidos mayores a $500", icon: Truck, color: "bg-green-700" },
  { label: "Precios mayoreo", desc: "Descuentos por volumen", icon: ShieldCheck, color: "bg-green-800" },
  { label: "Atención directa", desc: "Lunes a sábado 8–18 h", icon: Phone, color: "bg-green-900" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(n);

const normalizeProduct = (p: CatalogProduct): CatalogProduct => ({
  ...p,
  productLine: getProductLine(p),
  presentation: getProductPresentation(p),
  available: typeof p.available === "number" ? p.available : p.stockTotal ?? 0,
});

const readProducts = (): CatalogProduct[] => {
  try {
    const raw = window.localStorage.getItem(productsStorageKey);
    const items: CatalogProduct[] = raw ? JSON.parse(raw) : [];
    return items.map(normalizeProduct).filter((p) => p.salePrice > 0);
  } catch { return []; }
};

const readCart = (): CartItem[] => {
  try {
    const raw = window.localStorage.getItem(customerCartStorageKey);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const readAuth = (): AuthUser | null => {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const stockBadge = (available: number) => {
  if (available <= 0) return { label: "Agotado", cls: "bg-red-100 text-red-700 ring-red-300/60", dot: "bg-red-500" };
  if (available <= 10) return { label: "Últimas piezas", cls: "bg-amber-100 text-amber-700 ring-amber-300/60", dot: "bg-amber-500" };
  return { label: "Disponible", cls: "bg-emerald-100 text-emerald-700 ring-emerald-300/60", dot: "bg-emerald-500" };
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

type NavbarProps = {
  user: AuthUser | null;
  cartCount: number;
  search: string;
  onSearch: (v: string) => void;
  onOpenCart: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  onCategorySelect: (cat: string) => void;
  selectedCategory: string;
};

function Navbar({
  user, cartCount, search, onSearch, onOpenCart, onLogin, onRegister, onLogout,
  onCategorySelect, selectedCategory,
}: NavbarProps) {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDepsOpen, setDepsOpen] = useState(false);
  const depsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDepsOpen) return;
    const handler = (e: MouseEvent) => {
      if (!depsRef.current?.contains(e.target as Node)) setDepsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isDepsOpen]);

  const allCategoryNames = [ALL_CATS, ...CATEGORY_CONFIG.map((c) => c.name)];

  return (
    <header className="sticky top-0 z-50 border-b border-green-950/30 bg-[#0d2209] shadow-lg shadow-green-950/30">
      {/* Top band */}
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 lg:px-6">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Menú"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-green-200 transition hover:bg-white/10 lg:hidden"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo */}
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700 text-white shadow">
            <ShoppingCart className="h-5 w-5" />
          </span>
          <div className="hidden sm:block">
            <p className="text-[15px] font-bold leading-none text-white">Bosques</p>
            <p className="text-[11px] font-medium leading-none text-green-300">Comercializadora</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mx-2 flex-1 lg:mx-4 lg:max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-green-300" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar productos, marcas, categorías..."
            className="h-10 w-full rounded-lg bg-white/10 pl-10 pr-4 text-sm font-medium text-white placeholder:text-green-300 outline-none transition focus:bg-white/20 focus:ring-2 focus:ring-green-400/50"
          />
        </div>

        {/* Departments dropdown */}
        <div ref={depsRef} className="relative hidden lg:block">
          <button
            type="button"
            onClick={() => setDepsOpen((v) => !v)}
            className="flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-green-100 transition hover:bg-white/10"
          >
            <LayoutGrid className="h-4 w-4" />
            Departamentos
            <ChevronDown className={`h-4 w-4 transition-transform ${isDepsOpen ? "rotate-180" : ""}`} />
          </button>

          {isDepsOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
              {allCategoryNames.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { onCategorySelect(cat); setDepsOpen(false); }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-green-50 ${selectedCategory === cat ? "bg-green-50 text-green-700" : "text-slate-700"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <button
          type="button"
          onClick={onOpenCart}
          aria-label="Carrito"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-green-200 transition hover:bg-white/10"
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>

        {/* Auth */}
        {user ? (
          <div className="flex items-center gap-2 border-l border-white/15 pl-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-700 text-white">
              <UserRound className="h-4 w-4" />
            </span>
            <div className="hidden xl:block">
              <p className="text-sm font-semibold text-white leading-tight">{user.name}</p>
              <p className="text-[11px] text-green-300">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Cerrar sesión"
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-green-300 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-l border-white/15 pl-3">
            <button
              type="button"
              onClick={onLogin}
              className="hidden h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-green-100 transition hover:bg-white/10 sm:flex"
            >
              <LogIn className="h-4 w-4" />
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={onRegister}
              className="flex h-9 items-center gap-2 rounded-lg bg-green-700 px-4 text-sm font-semibold text-white shadow transition hover:bg-green-600"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Registrarse</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#0d2209] px-4 pb-3 lg:hidden">
          <div className="grid grid-cols-2 gap-1 pt-2">
            {allCategoryNames.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => { onCategorySelect(cat); setMobileMenuOpen(false); }}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition hover:bg-white/10 ${selectedCategory === cat ? "bg-white/15 text-white" : "text-green-200"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ onShop, onRegister, isAuthenticated }: { onShop: () => void; onRegister: () => void; isAuthenticated: boolean }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#071504] via-[#0d2209] to-[#102e09]">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #86efac 0%, transparent 60%), radial-gradient(circle at 80% 20%, #4ade80 0%, transparent 50%)" }} />
      <div className="relative mx-auto max-w-[1500px] px-4 py-16 sm:py-24 lg:px-6 lg:py-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-green-300 ring-1 ring-green-400/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            Mayoreo B2B — Comercializadora Bosques
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            Precios de mayoreo<br />
            <span className="text-green-400">para tu negocio</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-green-200">
            Abarrotes, bebidas, limpieza y más con precios competitivos para tiendas, restaurantes y distribuidores. Entrega rápida y asesoría personalizada.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onShop}
              className="flex h-12 items-center gap-2 rounded-xl bg-green-700 px-7 text-base font-bold text-white shadow-lg shadow-green-900/40 transition hover:bg-green-600 hover:-translate-y-0.5"
            >
              Ver catálogo
              <ArrowRight className="h-5 w-5" />
            </button>
            {!isAuthenticated && (
              <button
                type="button"
                onClick={onRegister}
                className="flex h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-7 text-base font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                <UserPlus className="h-5 w-5" />
                Registrar mi negocio
              </button>
            )}
          </div>

          <div className="mt-10 flex flex-wrap gap-6">
            {PROMOS.map((p) => (
              <div key={p.label} className="flex items-center gap-2.5">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${p.color} text-white shadow`}>
                  <p.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{p.label}</p>
                  <p className="text-xs text-green-300">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Categories Section ───────────────────────────────────────────────────────

function CategoriesSection({ onSelect, selected }: { onSelect: (cat: string) => void; selected: string }) {
  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-[1500px] px-4 lg:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-700">Navega por</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Departamentos</h2>
          </div>
          <button type="button" onClick={() => onSelect(ALL_CATS)} className="text-sm font-semibold text-green-700 transition hover:text-green-900">
            Ver todos →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORY_CONFIG.map((cat) => {
            const Icon = cat.icon;
            const isActive = selected === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => onSelect(cat.name)}
                className={`group flex flex-col items-center gap-2.5 rounded-xl border p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md ${
                  isActive
                    ? `${cat.bg} ${cat.border} ${cat.text} ring-2 ring-offset-1 ring-green-500`
                    : `border-slate-200 bg-white hover:${cat.bg} hover:${cat.border}`
                }`}
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.bg} ${cat.text}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-bold text-slate-800">{cat.name}</span>
                <span className="text-[11px] text-slate-500">{cat.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

type ProductCardProps = {
  product: CatalogProduct;
  cartQty: number;
  isAuthenticated: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onQuickView: () => void;
  onAuthRequired: () => void;
};

function ProductCard({ product, cartQty, isAuthenticated, onAdd, onRemove, onQuickView, onAuthRequired }: ProductCardProps) {
  const badge = stockBadge(product.available);
  const line = product.productLine ?? product.name;
  const pres = product.presentation ?? "";

  const handleAdd = () => {
    if (!isAuthenticated) { onAuthRequired(); return; }
    onAdd();
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* Image */}
      <button type="button" onClick={onQuickView} className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PackageCheck className="h-12 w-12 text-green-300" />
          </div>
        )}
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-500 opacity-0 shadow transition group-hover:opacity-100">
          <Eye className="h-4 w-4" />
        </span>
        {pres && (
          <span className="absolute left-2 top-2 rounded-lg bg-green-700 px-2 py-0.5 text-[11px] font-bold text-white">
            {pres}
          </span>
        )}
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">{product.category}</p>
        <button type="button" onClick={onQuickView} className="mt-1 text-left">
          <h3 className="line-clamp-2 min-h-12 text-base font-bold leading-snug text-slate-900">{line}</h3>
        </button>
        <p className="mt-1 text-xs text-slate-500">{product.brand}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-semibold ring-1 ${badge.cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>
          <span className="text-[11px] text-slate-400">{product.available} disp.</span>
        </div>

        <div className="mt-3">
          <p className="text-2xl font-extrabold text-slate-900">{fmt(product.salePrice)}</p>
          <p className="text-xs text-slate-500">por {product.tipoPrecio ?? "pieza"}</p>
        </div>

        <div className="mt-4">
          {cartQty > 0 ? (
            <div className="flex h-10 items-center overflow-hidden rounded-lg border border-green-200 bg-green-50">
              <button
                type="button"
                onClick={onRemove}
                className="flex h-10 w-10 items-center justify-center text-green-700 transition hover:bg-green-100"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="flex-1 text-center text-sm font-bold text-green-800">{cartQty}</span>
              <button
                type="button"
                onClick={handleAdd}
                disabled={product.available <= 0}
                className="flex h-10 w-10 items-center justify-center text-green-700 transition hover:bg-green-100 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={product.available <= 0}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-green-700 text-sm font-bold text-white shadow transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <ShoppingCart className="h-4 w-4" />
              {product.available <= 0 ? "Sin existencia" : "Agregar al carrito"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Quick View Modal ─────────────────────────────────────────────────────────

function QuickViewModal({
  product,
  cartQty,
  isAuthenticated,
  onClose,
  onAdd,
  onRemove,
  onAuthRequired,
}: {
  product: CatalogProduct;
  cartQty: number;
  isAuthenticated: boolean;
  onClose: () => void;
  onAdd: () => void;
  onRemove: () => void;
  onAuthRequired: () => void;
}) {
  const badge = stockBadge(product.available);
  const handleAdd = () => { if (!isAuthenticated) { onAuthRequired(); return; } onAdd(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">Vista rápida</h3>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-[260px_1fr]">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-50">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <PackageCheck className="h-16 w-16 text-green-300" />
            )}
          </div>
          <div>
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${badge.cls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">{product.productLine ?? product.name}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {[
                ["Marca", product.brand],
                ["Presentación", product.presentation ?? "—"],
                ["Categoría", product.category],
                ["SKU", product.barcode ?? product.id],
                ["Existencia", `${product.available} disponibles`],
                ["Precio por", product.tipoPrecio ?? "pieza"],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-0.5 font-semibold text-slate-800">{val}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900">{fmt(product.salePrice)}</p>
            <div className="mt-5">
              {cartQty > 0 ? (
                <div className="flex h-11 max-w-48 items-center overflow-hidden rounded-lg border border-green-200 bg-green-50">
                  <button type="button" onClick={onRemove} className="flex h-11 w-11 items-center justify-center text-green-700 transition hover:bg-green-100"><Minus className="h-4 w-4" /></button>
                  <span className="flex-1 text-center font-bold text-green-800">{cartQty}</span>
                  <button type="button" onClick={handleAdd} className="flex h-11 w-11 items-center justify-center text-green-700 transition hover:bg-green-100"><Plus className="h-4 w-4" /></button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={product.available <= 0}
                  className="flex h-11 items-center gap-2 rounded-lg bg-green-700 px-6 text-sm font-bold text-white transition hover:bg-green-800 disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Agregar al carrito
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────

type AuthModalProps = {
  isOpen: boolean;
  tab: AuthTab;
  onClose: () => void;
  onTabChange: (t: AuthTab) => void;
  onLoginSuccess: (user: AuthUser) => void;
  onRegisterSuccess: (user: AuthUser) => void;
};

function AuthModal({ isOpen, tab, onClose, onTabChange, onLoginSuccess, onRegisterSuccess }: AuthModalProps) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [regRazonSocial, setRegRazonSocial] = useState("");
  const [regRFC, setRegRFC] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regDirFiscal, setRegDirFiscal] = useState("");
  const [regDirEntrega, setRegDirEntrega] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPassConfirm, setRegPassConfirm] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginEmail || !loginPass) { setError("Completa todos los campos."); return; }
    const user: AuthUser = { name: loginEmail.split("@")[0], email: loginEmail };
    onLoginSuccess(user);
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!regRazonSocial || !regRFC || !regEmail || !regPass) { setError("Completa los campos obligatorios (*)"); return; }
    if (regPass !== regPassConfirm) { setError("Las contraseñas no coinciden."); return; }
    const user: AuthUser = { name: regRazonSocial, email: regEmail };
    onRegisterSuccess(user);
  };

  const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100";
  const labelClass = "space-y-1.5 text-sm font-semibold text-slate-700";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </h2>
            <p className="text-sm text-slate-500">
              {tab === "login"
                ? "Accede a tu cuenta para realizar compras."
                : "Para comprar es necesario registrarte."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {(["login", "register"] as AuthTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { onTabChange(t); setError(""); }}
              className={`flex-1 py-3 text-sm font-semibold transition ${tab === t ? "border-b-2 border-green-700 text-green-700" : "text-slate-500 hover:text-slate-700"}`}
            >
              {t === "login" ? "Iniciar sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <label className={labelClass}>
                <span>Correo electrónico *</span>
                <input required type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="correo@empresa.com" className={inputClass} />
              </label>
              <label className={labelClass}>
                <span>Contraseña *</span>
                <input required type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="••••••••" className={inputClass} />
              </label>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" className="accent-green-700" />
                  Recordarme
                </label>
                <button type="button" className="text-sm font-semibold text-green-700 hover:underline">
                  Olvidé mi contraseña
                </button>
              </div>
              <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-green-700 text-sm font-bold text-white transition hover:bg-green-800">
                <LogIn className="h-4 w-4" />
                Iniciar sesión
              </button>
              <p className="text-center text-sm text-slate-500">
                ¿No tienes cuenta?{" "}
                <button type="button" onClick={() => onTabChange("register")} className="font-semibold text-green-700 hover:underline">
                  Regístrate aquí
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className={`col-span-2 ${labelClass}`}>
                  <span>Razón social *</span>
                  <input required value={regRazonSocial} onChange={(e) => setRegRazonSocial(e.target.value)} placeholder="Mi Empresa S.A. de C.V." className={inputClass} />
                </label>
                <label className={labelClass}>
                  <span>RFC *</span>
                  <input required value={regRFC} onChange={(e) => setRegRFC(e.target.value.toUpperCase())} placeholder="XAXX010101000" maxLength={13} className={`${inputClass} font-mono uppercase`} />
                </label>
                <label className={labelClass}>
                  <span>Nombre del responsable</span>
                  <input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Nombre completo" className={inputClass} />
                </label>
                <label className={labelClass}>
                  <span>Correo *</span>
                  <input required type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="correo@empresa.com" className={inputClass} />
                </label>
                <label className={labelClass}>
                  <span>Teléfono</span>
                  <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="55 1234 5678" className={inputClass} />
                </label>
                <label className={`col-span-2 ${labelClass}`}>
                  <span>Dirección fiscal</span>
                  <input value={regDirFiscal} onChange={(e) => setRegDirFiscal(e.target.value)} placeholder="Calle, número, colonia, CP, ciudad" className={inputClass} />
                </label>
                <label className={`col-span-2 ${labelClass}`}>
                  <span>Dirección de entrega</span>
                  <input value={regDirEntrega} onChange={(e) => setRegDirEntrega(e.target.value)} placeholder="Si es diferente a la fiscal" className={inputClass} />
                </label>
                <label className={labelClass}>
                  <span>Contraseña *</span>
                  <input required type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)} placeholder="Min. 8 caracteres" minLength={8} className={inputClass} />
                </label>
                <label className={labelClass}>
                  <span>Confirmar contraseña *</span>
                  <input required type="password" value={regPassConfirm} onChange={(e) => setRegPassConfirm(e.target.value)} placeholder="Repite tu contraseña" className={inputClass} />
                </label>
              </div>
              <button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-green-700 text-sm font-bold text-white transition hover:bg-green-800">
                <UserPlus className="h-4 w-4" />
                Crear cuenta
              </button>
              <p className="text-center text-sm text-slate-500">
                ¿Ya tienes cuenta?{" "}
                <button type="button" onClick={() => onTabChange("login")} className="font-semibold text-green-700 hover:underline">
                  Inicia sesión
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Auth Required Prompt Modal ───────────────────────────────────────────────

function AuthRequiredModal({ onClose, onLogin, onRegister }: { onClose: () => void; onLogin: () => void; onRegister: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
          <ShoppingCart className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">Inicia sesión para comprar</h3>
        <p className="mt-2 text-sm text-slate-500">
          Para agregar productos al carrito y realizar compras necesitas registrarte o iniciar sesión.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onLogin}
            className="flex h-10 items-center justify-center gap-2 rounded-lg border border-green-200 text-sm font-bold text-green-700 transition hover:bg-green-50"
          >
            <LogIn className="h-4 w-4" />
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={onRegister}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-green-700 text-sm font-bold text-white transition hover:bg-green-800"
          >
            <UserPlus className="h-4 w-4" />
            Registrarse
          </button>
        </div>
        <button type="button" onClick={onClose} className="mt-3 text-sm text-slate-400 transition hover:text-slate-600">
          Seguir navegando
        </button>
      </div>
    </div>
  );
}

// ─── Cart Drawer ──────────────────────────────────────────────────────────────

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  cartProducts: Array<CatalogProduct & { quantity: number }>;
  subtotal: number;
  iva: number;
  total: number;
  freeShippingProgress: number;
  freeShippingRemaining: number;
  onRemove: (id: string) => void;
  onAdd: (id: string) => void;
  onSubtract: (id: string) => void;
  onCheckout: () => void;
};

function CartDrawer({
  isOpen, onClose, cartProducts, subtotal, iva, total,
  freeShippingProgress, freeShippingRemaining,
  onRemove, onAdd, onSubtract, onCheckout,
}: CartDrawerProps) {
  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar carrito"
        className={`absolute inset-0 bg-black/40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-700">Mi pedido</p>
            <h2 className="text-lg font-bold text-slate-900">Carrito de compras</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Free shipping progress */}
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">
              {freeShippingRemaining > 0 ? `Faltan ${fmt(freeShippingRemaining)} para envío gratis` : "Envío gratis desbloqueado 🎉"}
            </span>
            <Truck className="h-4 w-4 text-green-700" />
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${freeShippingProgress}%` }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cartProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-slate-200" />
              <p className="mt-3 text-sm font-semibold text-slate-500">Tu carrito está vacío</p>
              <p className="text-xs text-slate-400">Agrega productos desde el catálogo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartProducts.map((p) => (
                <div key={p.id} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <PackageCheck className="h-7 w-7 text-green-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">{p.productLine ?? p.name}</p>
                    <p className="text-xs text-slate-500">{p.presentation} · {fmt(p.salePrice)} c/u</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <button type="button" onClick={() => onSubtract(p.id)} className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:bg-slate-100"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-sm font-bold text-slate-800">{p.quantity}</span>
                        <button type="button" onClick={() => onAdd(p.id)} className="flex h-8 w-8 items-center justify-center text-slate-500 transition hover:bg-slate-100"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{fmt(p.salePrice * p.quantity)}</span>
                      <button type="button" onClick={() => onRemove(p.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>IVA (16%)</span><span>{fmt(iva)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900"><span>Total</span><span>{fmt(total)}</span></div>
          </div>
          <button
            type="button"
            onClick={onCheckout}
            disabled={cartProducts.length === 0}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-700 text-sm font-bold text-white shadow-lg shadow-green-700/30 transition hover:bg-green-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            <BadgeCheck className="h-5 w-5" />
            Finalizar compra
          </button>
        </div>
      </aside>
    </div>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────

type CheckoutModalProps = {
  cartProducts: Array<CatalogProduct & { quantity: number }>;
  subtotal: number;
  iva: number;
  total: number;
  onClose: () => void;
  onConfirm: () => void;
};

function CheckoutModal({ cartProducts, subtotal, iva, total, onClose, onConfirm }: CheckoutModalProps) {
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta">("efectivo");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <form onSubmit={handleSubmit} className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Confirmar pedido</h2>
            <p className="text-sm text-slate-500">Revisa tu pedido y completa la información de entrega.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {/* Payment methods */}
            <div>
              <p className="mb-2 text-sm font-bold text-slate-700">Método de pago</p>
              <div className="grid grid-cols-2 gap-3">
                {(["efectivo", "tarjeta"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-xl border p-3 text-left text-sm font-semibold transition ${paymentMethod === m ? "border-green-600 bg-green-50 text-green-800" : "border-slate-200 text-slate-600 hover:border-green-200"}`}
                  >
                    {m === "efectivo" ? "💵 Efectivo contra entrega" : "💳 Tarjeta bancaria"}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            <label className="space-y-1.5 text-sm font-semibold text-slate-700">
              <span>Dirección de entrega *</span>
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, colonia, C.P., ciudad"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </label>

            {/* Notes */}
            <label className="space-y-1.5 text-sm font-semibold text-slate-700">
              <span>Observaciones</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Instrucciones especiales para la entrega..."
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </label>
          </div>

          {/* Order summary */}
          <aside className="rounded-xl border border-slate-200 p-4">
            <p className="font-bold text-slate-900">Resumen del pedido</p>
            <div className="mt-3 space-y-2">
              {cartProducts.map((p) => (
                <div key={p.id} className="flex justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-slate-600">{p.quantity} × {p.productLine ?? p.name}</span>
                  <span className="font-semibold text-slate-900">{fmt(p.salePrice * p.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-slate-500"><span>IVA (16%)</span><span>{fmt(iva)}</span></div>
              <div className="flex justify-between pt-1 text-base font-bold text-slate-900"><span>Total</span><span>{fmt(total)}</span></div>
            </div>
            <button type="submit" className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-700 text-sm font-bold text-white transition hover:bg-green-800">
              <BadgeCheck className="h-4 w-4" />
              Confirmar pedido
            </button>
          </aside>
        </div>
      </form>
    </div>
  );
}

// ─── Order Confirmed ──────────────────────────────────────────────────────────

function OrderConfirmed({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <BadgeCheck className="h-9 w-9" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-slate-900">¡Pedido confirmado!</h2>
        <p className="mt-2 text-sm text-slate-500">
          Tu pedido ha sido recibido. Un asesor te contactará en breve para coordinar la entrega.
        </p>
        <div className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          <p className="font-semibold">Atención a clientes</p>
          <p className="mt-0.5 flex items-center justify-center gap-1"><Phone className="h-3.5 w-3.5" /> 55 1234 5678</p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-700 text-sm font-bold text-white transition hover:bg-green-800"
        >
          <ReceiptText className="h-4 w-4" />
          Seguir comprando
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StorefrontView() {
  const catalogRef = useRef<HTMLDivElement>(null);

  // Products
  const [products, setProducts] = useState<CatalogProduct[]>(() => readProducts());

  // Auth
  const [user, setUser] = useState<AuthUser | null>(() => readAuth());

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>(() => readCart());

  // Modals / drawers
  const [isCartOpen, setCartOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; tab: AuthTab }>({ isOpen: false, tab: "login" });
  const [showAuthRequired, setShowAuthRequired] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<CatalogProduct | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmed, setShowConfirmed] = useState(false);

  // Catalog filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATS);
  const [selectedBrand, setSelectedBrand] = useState("Todas las marcas");
  const [maxPrice, setMaxPrice] = useState(1000);
  const [sortBy, setSortBy] = useState<"nombre" | "precio-asc" | "precio-desc" | "disponibilidad">("nombre");

  // Sync products from localStorage
  useEffect(() => {
    const reload = () => setProducts(readProducts());
    window.addEventListener("comercializadora-bosques-products-updated", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("comercializadora-bosques-products-updated", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  // Persist cart
  useEffect(() => {
    window.localStorage.setItem(customerCartStorageKey, JSON.stringify(cartItems));
    window.dispatchEvent(new Event(customerCartUpdatedEvent));
  }, [cartItems]);

  // Persist auth
  useEffect(() => {
    if (user) window.localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    else window.localStorage.removeItem(AUTH_KEY);
  }, [user]);

  // Highest price
  const highestPrice = useMemo(
    () => Math.max(100, Math.ceil(Math.max(...products.map((p) => p.salePrice), 100) / 50) * 50),
    [products],
  );

  useEffect(() => { setMaxPrice(highestPrice); }, [highestPrice]);

  // Brand options
  const brandOptions = useMemo(
    () => ["Todas las marcas", ...Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).sort()],
    [products],
  );

  // Filtered + sorted products
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = products.filter((p) => {
      const matchesSearch = !q || [p.name, p.brand, p.category, p.productLine ?? "", p.presentation ?? "", p.barcode ?? ""].some((s) => s.toLowerCase().includes(q));
      const matchesCat = selectedCategory === ALL_CATS || p.category === selectedCategory || CATEGORY_CONFIG.some((c) => c.name === selectedCategory && p.category.toLowerCase().includes(c.name.toLowerCase()));
      const matchesBrand = selectedBrand === "Todas las marcas" || p.brand === selectedBrand;
      const matchesPrice = p.salePrice <= maxPrice;
      return matchesSearch && matchesCat && matchesBrand && matchesPrice;
    });
    if (sortBy === "precio-asc") result = [...result].sort((a, b) => a.salePrice - b.salePrice);
    else if (sortBy === "precio-desc") result = [...result].sort((a, b) => b.salePrice - a.salePrice);
    else if (sortBy === "nombre") result = [...result].sort((a, b) => (a.productLine ?? a.name).localeCompare(b.productLine ?? b.name));
    else if (sortBy === "disponibilidad") result = [...result].sort((a, b) => b.available - a.available);
    return result;
  }, [products, search, selectedCategory, selectedBrand, maxPrice, sortBy]);

  const featuredProducts = useMemo(() => products.filter((p) => p.available > 0).slice(0, 4), [products]);

  // Cart computations
  const cartProducts = useMemo(
    () => cartItems.map((item) => {
      const p = products.find((prod) => prod.id === item.productId);
      return p ? { ...p, quantity: item.quantity } : null;
    }).filter((p): p is CatalogProduct & { quantity: number } => Boolean(p)),
    [cartItems, products],
  );

  const subtotal = cartProducts.reduce((s, p) => s + p.salePrice * p.quantity, 0);
  const iva = subtotal * IVA_RATE;
  const total = subtotal + iva;
  const cartCount = cartProducts.reduce((s, p) => s + p.quantity, 0);
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_MIN - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100);

  const getCartQty = (productId: string) => cartItems.find((i) => i.productId === productId)?.quantity ?? 0;

  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product || product.available <= 0) return;
    setCartItems((items) => {
      const existing = items.find((i) => i.productId === productId);
      if (existing) {
        return items.map((i) => i.productId === productId ? { ...i, quantity: Math.min(i.quantity + 1, product.available) } : i);
      }
      return [...items, { productId, quantity: 1 }];
    });
  };

  const removeOneFromCart = (productId: string) => {
    setCartItems((items) => {
      const existing = items.find((i) => i.productId === productId);
      if (!existing) return items;
      if (existing.quantity <= 1) return items.filter((i) => i.productId !== productId);
      return items.map((i) => i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((items) => items.filter((i) => i.productId !== productId));
  };

  const openAuth = (tab: AuthTab) => {
    setShowAuthRequired(false);
    setAuthModal({ isOpen: true, tab });
  };

  const onAuthSuccess = (u: AuthUser) => {
    setUser(u);
    setAuthModal({ isOpen: false, tab: "login" });
  };

  const handleLogout = () => {
    setUser(null);
    setCartItems([]);
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setShowCheckout(true);
  };

  const handleConfirmOrder = () => {
    window.localStorage.setItem(customerInvoicesStorageKey, JSON.stringify([{
      id: `PED-${Date.now()}`,
      date: new Date().toISOString(),
      items: cartProducts.map((p) => ({ productId: p.id, name: p.name, quantity: p.quantity, unitPrice: p.salePrice })),
      subtotal, iva, total, status: "Pendiente",
    }]));
    setCartItems([]);
    setShowCheckout(false);
    setShowConfirmed(true);
  };

  const scrollToCatalog = () => catalogRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    window.setTimeout(() => catalogRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      <Navbar
        user={user}
        cartCount={cartCount}
        search={search}
        onSearch={setSearch}
        onOpenCart={() => setCartOpen(true)}
        onLogin={() => openAuth("login")}
        onRegister={() => openAuth("register")}
        onLogout={handleLogout}
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />

      <main>
        {/* Hero */}
        <Hero onShop={scrollToCatalog} onRegister={() => openAuth("register")} isAuthenticated={Boolean(user)} />

        {/* Categories */}
        <CategoriesSection onSelect={handleCategorySelect} selected={selectedCategory} />

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="bg-gray-50 py-10">
            <div className="mx-auto max-w-[1500px] px-4 lg:px-6">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-green-700">Lo más popular</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Productos destacados</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    cartQty={getCartQty(p.id)}
                    isAuthenticated={Boolean(user)}
                    onAdd={() => addToCart(p.id)}
                    onRemove={() => removeOneFromCart(p.id)}
                    onQuickView={() => setQuickViewProduct(p)}
                    onAuthRequired={() => setShowAuthRequired(true)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Promo banner */}
        <section className="bg-gradient-to-r from-green-700 to-green-900 py-8">
          <div className="mx-auto max-w-[1500px] px-4 lg:px-6">
            <div className="grid gap-6 sm:grid-cols-3">
              {PROMOS.map((p) => (
                <div key={p.label} className="flex items-center gap-4 text-white">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <p.icon className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="font-bold">{p.label}</p>
                    <p className="text-sm text-green-200">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Full Catalog */}
        <section ref={catalogRef} className="py-10">
          <div className="mx-auto max-w-[1500px] px-4 lg:px-6">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-green-700">Todo disponible</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Catálogo completo</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
              {/* Sidebar filters */}
              <aside className="space-y-4">
                {/* Category filter */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Departamento</p>
                  <div className="space-y-1">
                    {[ALL_CATS, ...CATEGORY_CONFIG.map((c) => c.name)].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition ${selectedCategory === cat ? "bg-green-50 text-green-800 font-semibold" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand filter */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Marca</p>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm text-slate-700 outline-none focus:border-green-600"
                  >
                    {brandOptions.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>

                {/* Price filter */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Precio hasta {fmt(maxPrice)}</p>
                  <input
                    type="range"
                    min={0}
                    max={highestPrice}
                    step={10}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-green-700"
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-400">
                    <span>$0</span>
                    <span>{fmt(highestPrice)}</span>
                  </div>
                </div>

                {/* Reset filters */}
                <button
                  type="button"
                  onClick={() => { setSelectedCategory(ALL_CATS); setSelectedBrand("Todas las marcas"); setMaxPrice(highestPrice); setSearch(""); }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Limpiar filtros
                </button>
              </aside>

              {/* Product grid */}
              <div>
                {/* Toolbar */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-500">
                    {filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"}
                    {selectedCategory !== ALL_CATS ? ` en ${selectedCategory}` : ""}
                  </p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-green-600"
                  >
                    <option value="nombre">Ordenar: A–Z</option>
                    <option value="precio-asc">Precio: menor a mayor</option>
                    <option value="precio-desc">Precio: mayor a menor</option>
                    <option value="disponibilidad">Disponibilidad</option>
                  </select>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
                    <Package className="h-10 w-10 text-slate-200" />
                    <p className="mt-3 font-semibold text-slate-500">Sin productos con esos filtros</p>
                    <button type="button" onClick={() => { setSelectedCategory(ALL_CATS); setSelectedBrand("Todas las marcas"); }} className="mt-2 text-sm font-semibold text-green-700 hover:underline">
                      Limpiar filtros
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        cartQty={getCartQty(p.id)}
                        isAuthenticated={Boolean(user)}
                        onAdd={() => addToCart(p.id)}
                        onRemove={() => removeOneFromCart(p.id)}
                        onQuickView={() => setQuickViewProduct(p)}
                        onAuthRequired={() => setShowAuthRequired(true)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-[#0d2209] py-8 text-green-300">
        <div className="mx-auto max-w-[1500px] px-4 lg:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-700 text-white">
                <ShoppingCart className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Comercializadora Bosques</p>
                <p className="text-xs text-green-400">Mayoreo B2B · RFC: XAXX010101000</p>
              </div>
            </div>
            <p className="text-xs text-green-400">© 2026 Comercializadora Bosques. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setCartOpen(false)}
        cartProducts={cartProducts}
        subtotal={subtotal}
        iva={iva}
        total={total}
        freeShippingProgress={freeShippingProgress}
        freeShippingRemaining={freeShippingRemaining}
        onRemove={removeFromCart}
        onAdd={addToCart}
        onSubtract={removeOneFromCart}
        onCheckout={handleCheckout}
      />

      {showAuthRequired && (
        <AuthRequiredModal
          onClose={() => setShowAuthRequired(false)}
          onLogin={() => openAuth("login")}
          onRegister={() => openAuth("register")}
        />
      )}

      <AuthModal
        isOpen={authModal.isOpen}
        tab={authModal.tab}
        onClose={() => setAuthModal((m) => ({ ...m, isOpen: false }))}
        onTabChange={(tab) => setAuthModal((m) => ({ ...m, tab }))}
        onLoginSuccess={onAuthSuccess}
        onRegisterSuccess={onAuthSuccess}
      />

      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          cartQty={getCartQty(quickViewProduct.id)}
          isAuthenticated={Boolean(user)}
          onClose={() => setQuickViewProduct(null)}
          onAdd={() => addToCart(quickViewProduct.id)}
          onRemove={() => removeOneFromCart(quickViewProduct.id)}
          onAuthRequired={() => { setQuickViewProduct(null); setShowAuthRequired(true); }}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          cartProducts={cartProducts}
          subtotal={subtotal}
          iva={iva}
          total={total}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleConfirmOrder}
        />
      )}

      {showConfirmed && (
        <OrderConfirmed onContinue={() => setShowConfirmed(false)} />
      )}
    </div>
  );
}
