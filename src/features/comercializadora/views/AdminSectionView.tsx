import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Boxes, Construction, Database, Layers3 } from "lucide-react";
import { claseTarjeta } from "@/shared/ui/estilosDashboard";

const sectionLabels: Record<string, string> = {
  "catalog/categories": "Categorías",
  "catalog/brands": "Marcas",
  "catalog/units": "Unidades de medida",
  "catalog/barcodes": "Códigos de barras",
  "inventory/stock": "Existencias",
  "inventory/movements": "Movimientos",
  "inventory/adjustments": "Ajustes",
  "purchases/suppliers": "Proveedores",
  "purchases/orders": "Órdenes de compra",
  "purchases/receptions": "Recepciones",
  "sales/orders": "Pedidos",
  "sales/invoices": "Facturas",
  "reports/inventory": "Reporte de inventario",
  "reports/sales": "Reporte de ventas",
  "reports/purchases": "Reporte de compras",
  "settings/warehouses": "Almacenes",
  "settings/users": "Usuarios",
  "settings/roles": "Roles",
};

export default function AdminSectionView() {
  const location = useLocation();
  const sectionKey = location.pathname.replace(/^\/dashboard\//, "");
  const sectionLabel = useMemo(() => sectionLabels[sectionKey] ?? "Administración", [sectionKey]);

  return (
    <section className="mx-auto w-full max-w-[1500px]">
      <div className={claseTarjeta("overflow-hidden bg-white text-slate-950")}>
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Administrador</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-950">{sectionLabel}</h2>
          <p className="mt-1 text-sm text-slate-500">Sección preparada para operar dentro del menú administrativo.</p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-3">
          {[
            { label: "Estructura", detail: "Lista, búsqueda y edición", icon: Layers3 },
            { label: "Datos", detail: "Conexión con modelo PK/SK", icon: Database },
            { label: "Flujo", detail: "Pendiente de reglas específicas", icon: Construction },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-slate-950">{item.label}</h3>
                <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
              </article>
            );
          })}
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
          <Boxes className="mr-2 inline h-4 w-4 text-blue-600" />
          Esta pantalla ya queda conectada al sidebar; el siguiente paso sería definir campos de negocio por módulo.
        </div>
      </div>
    </section>
  );
}
