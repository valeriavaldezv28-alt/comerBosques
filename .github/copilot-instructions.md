# Instrucciones para Copilot - Magict Dashboard

## Descripción General

Magict Dashboard es un panel administrativo web para un Payment Service Provider (PSP). La aplicación centraliza métricas de negocio, pagos, transacciones y reportes en una SPA orientada a operaciones.

## Arquitectura Real

La base del proyecto es una arquitectura feature-based con separación clara entre infraestructura compartida, módulos de dominio y páginas de entrada. La app consume APIs reales o configuradas por entorno a través de un cliente HTTP centralizado.

### Stack Principal
- Frontend: React 18 + TypeScript.
- Build: Vite.
- Estilos: Tailwind CSS con variables CSS para tema claro/oscuro.
- Routing: React Router DOM.
- Estado remoto: TanStack Query.
- Estado local: Zustand para autenticación y sesión persistente.
- API: `src/shared/api/apiClient.ts` como wrapper único de `fetch`.
- UI: Radix UI, Lucide React y componentes propios en `src/components/ui/`.
- Testing: Vitest + Testing Library.
- Utilidades: `clsx` y `tailwind-merge` a través de `src/lib/utils.ts`.

### Organización de Carpetas
- `src/shared/`: infraestructura compartida de la app.
  - `api/`: cliente HTTP, configuración, paginación y manejo de token.
  - `layouts/`: `DashboardLayout`, `Sidebar`, `Topbar`.
  - `ui/`: helpers visuales compartidos.
  - `utils/`: utilidades reutilizables como `csvDownload.ts` y `currencyNormalization.ts`.
  - `config/`: variables de entorno y configuración común.
- `src/components/ui/`: componentes UI reutilizables entre features.
- `src/features/`: módulos de dominio.
  - `auth/`: autenticación, permisos, roles, store y rutas protegidas.
  - `dashboard/`: configuración, dominio, mappers, hooks, widgets y vista principal.
  - `payments/`: módulo centralizado de pagos con subfeatures `attempts`, `successful`, `rejected` y `refunds`.
  - `transactions/`: vista y lógica de transacciones administrativas.
  - `theme/`: gestión de modo claro/oscuro.
  - `i18n/`: selector de idioma y utilidades de traducción.
- `src/pages/`: páginas de entrada de la aplicación.
- `src/config/`: rutas de la app y paths protegidos.
- `src/lib/`: helpers generales como `cn`.

### Flujo de Aplicación
- `src/App.tsx` monta `ProveedorModoTema`, `TooltipProvider`, `BrowserRouter` y el árbol de rutas.
- `src/config/routes.tsx` centraliza las rutas públicas y protegidas.
- `src/config/routePaths.ts` centraliza los paths compartidos para navegación.
- `src/features/auth/ProtectedRoute.tsx` y `src/features/auth/RutaProtegida` protegen las secciones autenticadas.
- `src/shared/layouts/DashboardLayout.tsx` envuelve las vistas internas con navegación y topbar.

## Feature `payments`

`payments` es un módulo de dominio centralizado. Las vistas públicas se exponen por barrel y cada subfeature mantiene su propia lógica de API, mapeo, hooks, servicios, tipos y componentes.

Estructura real esperada:

```text
src/features/payments/
├── attempts/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── mappers/
│   ├── services/
│   ├── types/
│   └── views/
├── successful/
│   ├── api/
│   ├── components/
│   ├── config/
│   ├── hooks/
│   ├── mappers/
│   ├── services/
│   ├── types/
│   └── views/
├── rejected/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── mappers/
│   ├── services/
│   ├── types/
│   └── views/
├── refunds/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── mappers/
│   ├── services/
│   ├── types/
│   └── views/
└── shared/
    ├── api/
    ├── components/
    ├── hooks/
    ├── mappers/
    ├── services/
    ├── types/
    └── paymentSearch.ts
```

### Reglas del módulo `payments`
- Mantén la lógica de negocio en `services/` o `mappers/`.
- Mantén la UI en `components/` o `views/`.
- Usa el barrel de cada feature antes de hacer imports profundos.
- No reintroduzcas mocks si ya existe implementación real.
- Si hay normalización compartida entre subfeatures, colócala en `shared/`.

## Reglas de Código

- Usa camelCase para variables y funciones.
- Usa PascalCase para componentes y tipos.
- Prefiere barrels de feature sobre imports profundos cuando exista el barrel.
- Mantén la lógica de negocio en `services/`, `domain/` o `mappers/`.
- Mantén la UI en `components/` o `views/`.
- No agregues comentarios largos si el código ya es claro.

## Datos y API

- No llames `fetch` directamente desde la UI.
- Usa `src/shared/api/apiClient.ts` para todas las solicitudes.
- Usa `src/shared/api/apiConfig.ts` para endpoints y base URL.
- Usa TanStack Query para cache, refetch, loading y error states.
- Si un feature necesita normalización o adaptación de payload, colócala en `services/`, `mappers/` o `shared/utils/` según corresponda.

## Diseño y UI

- Conserva el look and feel actual: dashboard administrativo, responsivo y utilitario.
- Respeta las variables CSS y el sistema de tema claro/oscuro.
- Usa componentes reutilizables de `src/components/ui/` antes de duplicar UI.
- Mantén el lenguaje visual consistente con los layouts compartidos de `src/shared/layouts/`.

## Routing

- Las rutas se centralizan en `src/config/routes.tsx`.
- Los paths reutilizables se centralizan en `src/config/routePaths.ts`.
- Usa `ProtectedRoute` o `RutaProtegida` para secciones autenticadas.
- Mantén los layouts anidados con `DashboardLayout`.

## Testing

- Escribe tests para servicios, mappers y hooks críticos.
- Mantén Vitest + Testing Library para cobertura de lógica y componentes.
- Si cambias un contrato de API o un mapper, actualiza también el test asociado.

## Referencias Útiles

- `src/config/routes.tsx`
- `src/config/routePaths.ts`
- `src/features/payments/index.ts`
- `src/features/payments/shared/paymentSearch.ts`
- `src/shared/api/apiClient.ts`
- `src/shared/layouts/DashboardLayout.tsx`
- `src/shared/layouts/Topbar.tsx`

Esta guía debe reflejar la arquitectura real del repo: modular, feature-based, con `payments` como módulo centralizado y API realizada mediante un cliente HTTP compartido.
