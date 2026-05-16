# Comercializadora Bosques

Plantilla base para construir el proyecto de Comercializadora Bosques con React, Vite, Tailwind CSS, rutas, tema claro/oscuro e internacionalizacion.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

## Estructura principal

```text
src/
  components/ui/        Componentes UI compartidos
  config/               Rutas de la aplicacion
  features/
    comercializadora/   Pantallas base del negocio
    i18n/               Selector de idioma
    theme/              Tema claro/oscuro
  locales/              Textos ES/EN
  shared/
    layouts/            Sidebar, topbar y layout principal
    ui/                 Helpers visuales
```

La plantilla ya no contiene el dominio anterior de pagos, transacciones o documentacion PSP. Desde aqui se pueden agregar los modulos propios de catalogo, clientes, pedidos, inventario y reportes.
