# Magictronic PSP Dashboard

Dashboard web para monitoreo y operacion de pagos de Magictronic PSP. La aplicacion permite revisar KPIs, graficas operativas, intenciones de pago, pagos exitosos, transacciones rechazadas, reembolsos y busqueda de transacciones desde la barra superior.

## Stack principal

- React 18 + TypeScript
- Vite 8
- React Router 6
- TanStack Query para cache y consultas de API
- Zustand para estado de autenticacion
- Tailwind CSS para estilos
- Radix UI Tooltip
- i18next/react-i18next para internacionalizacion
- Lucide React para iconos
- Vitest + Testing Library para pruebas
- ESLint + TypeScript strict para calidad de codigo
- rollup-plugin-visualizer para analisis visual del bundle

## Requisitos

- Node.js compatible con `package-lock.json`
- npm
- Acceso al backend de Magictronic PSP o a un proxy local configurado

## Instalacion

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

Por configuracion, Vite escucha en `::` y usa el puerto definido por `VITE_DEV_SERVER_PORT` o `8081`.

En desarrollo, la app usa `/api/v1` como base para que Vite haga proxy al backend. El proxy intercepta llamadas bajo `/api`, elimina `origin` y `referer`, y reenvia la peticion al target configurado.

## Variables de entorno

El proyecto usa variables `VITE_*`.

Ejemplo:

```env
VITE_API_URL=https://sandbox.magictronicplanet.com/api/v1
VITE_API_PROXY_TARGET=https://sandbox.magictronicplanet.com
VITE_DASHBOARD_INTENTS_API_URL=/api/v1/dashboard/intents
VITE_DASHBOARD_REFRESH_INTERVAL=300000
VITE_TOKEN_REFRESH_SKEW_MS=30000
VITE_SESSION_INACTIVITY_TIMEOUT_MS=60000
```

Variables soportadas:

- `VITE_API_URL` o `VITE_API_BASE_URL`: URL base del backend en produccion.
- `VITE_API_PROXY_TARGET`: origen alternativo para el proxy de Vite.
- `VITE_DEV_SERVER_PORT`: puerto del servidor local. Default: `8081`.
- `VITE_API_REQUEST_TIMEOUT_MS`: timeout HTTP. Default: `10000`.
- `VITE_API_RETRY_LIMIT`: reintentos de queries. Default: `1`.
- `VITE_DASHBOARD_INTENTS_API_URL`: endpoint dedicado opcional para intenciones de pago.
- `VITE_DASHBOARD_REFRESH_INTERVAL`: refresco automatico del dashboard. Default: `300000`.
- `VITE_TOKEN_REFRESH_SKEW_MS`: margen antes de expiracion del token. Default: `30000`.
- `VITE_SESSION_INACTIVITY_TIMEOUT_MS`: tiempo sin actividad antes de cerrar sesion. Default: `60000`.
- `VITE_DEV_TOKEN`: token JWT para pruebas locales sin pasar por login, solo en modo desarrollo.
- `VITE_SUPPORT_EMAIL`: email global de soporte.
- `VITE_DOCS_URL`: URL global de documentacion.

## Comandos

```bash
npm run dev
npm run build
npm run build:dev
npm run preview
npm run lint
npm run lint:fix
npm run typecheck
npm run test
npm run test:watch
npm run check
```

`npm run check` ejecuta lint, typecheck, tests y build.

Nota: en algunos entornos sandbox, Vitest puede fallar al cargar `vitest.config.ts` por permisos. Si ocurre, ejecutar la misma prueba fuera del sandbox.

## Rutas principales

Rutas publicas:

- `/`
- `/login`

Rutas protegidas:

- `/dashboard`
- `/dashboard/payment-intents`
- `/dashboard/rejected-transactions`
- `/dashboard/successful-payments`
- `/dashboard/refunds`
- `/transactions`

El acceso protegido se gestiona con `RutaProtegida`, roles y JWT. Los roles principales son `admin` y `client`.

## Estructura del proyecto

```text
src/
  components/ui/          Componentes UI compartidos
  config/                 Rutas y paths de navegacion
  features/
    auth/                 Login, sesion, permisos y roles
    dashboard/            KPIs, graficas y vista principal
    i18n/                 Selector de idioma
    payments/
      attempts/           Intenciones de pago
      rejected/           Transacciones rechazadas
      refunds/            Reembolsos
      shared/             Busqueda y utilidades compartidas de pagos
      successful/         Pagos exitosos
    theme/                Tema claro/oscuro
    transactions/         Vista de transacciones
  locales/                Traducciones en ingles y espanol
  pages/                  Paginas raiz para React Router
  shared/
    api/                  Cliente HTTP, tokens y configuracion de API
    config/               Variables de entorno y app config
    layouts/              Layout, sidebar y topbar
    ui/                   UI compartida y fallbacks de ruta
    utils/                Utilidades comunes
  test/                   Setup de pruebas
```

## Arquitectura por feature

Los modulos siguen una separacion consistente:

- `api/`: construye requests HTTP.
- `services/`: adapta llamadas de API para el dominio.
- `mappers/`: transforma payloads del backend a modelos de UI.
- `hooks/`: encapsula TanStack Query y estado de datos.
- `types/`: contratos TypeScript.
- `views/`: pantallas principales.
- `components/`: tablas o UI propia del feature.

Esta separacion evita que las vistas dependan directamente de la forma cruda del backend.

## Autenticacion y API

El login usa `POST /auth/login` y espera `accessToken`, con soporte opcional para `refreshToken`, `tokenType` y `expiresIn`.

El cliente HTTP central esta en `src/shared/api/apiClient.ts`:

- Construye URLs relativas contra `ENV.API_URL`.
- Adjunta `Authorization: Bearer <token>` salvo cuando se usa `skipAuthHeader`.
- Aplica timeout con `AbortController`.
- Normaliza errores HTTP a mensajes seguros para UI.
- Maneja respuestas `204`.

Los tokens se administran desde `src/shared/api/tokenManager.ts`.

## Dashboard

El dashboard administrativo consume endpoints como:

- `/dashboard/kpis`
- `/dashboard/hourly`
- `/dashboard/pulse`
- `/dashboard/status-distribution`

Los requests financieros se construyen con rango de dia UTC:

- `from=YYYY-MM-DDT00:00:00Z`
- `to=YYYY-MM-DDT00:00:00Z`

Las graficas principales son:

- `Transaction distribution`: distribucion por estados operativos.
- `Hourly pulse`: volumen y transacciones por hora, con scroll horizontal.
- `Hourly success performance`: rendimiento por hora.
- Tarjeta de referencia UTC con hora y fecha operativa.

## Pagos y busqueda

El modulo de pagos incluye:

- Intenciones de pago
- Pagos exitosos
- Transacciones rechazadas
- Reembolsos
- Busqueda compartida por `transactionId` u `orderId`

El topbar permite buscar una transaccion y abrir un modal con resumen. Si el estado corresponde a una transaccion exitosa, el boton `View in page` navega a Successful Payments con query params.

## Manejo de fechas y horas

Toda la logica financiera y de pagos usa UTC como fuente de verdad. Esto evita diferencias entre usuarios ubicados en Mexico, New York, California u otra zona horaria.

Reglas implementadas:

- Los filtros `Hoy`, `Ayer` y los rangos de busqueda se calculan en calendario UTC.
- Todos los requests financieros al backend envian rangos UTC explicitos.
- `to` representa el inicio del dia siguiente en UTC para cubrir el dia completo de forma exclusiva.
- `createdAt` se preserva como llega del backend en los mappers.
- Tablas, modales y CSV financieros formatean fechas con `timeZone: "UTC"` y muestran la etiqueta `UTC` cuando incluyen hora.
- Las utilidades centrales viven en `src/shared/utils/paymentDateRange.ts`.

Ejemplo:

```text
Backend: 2026-05-14T04:22:18Z
UI financiera: May 14, 2026, 04:22 AM UTC
```

La UI no convierte este valor a hora local del navegador. Asi se conserva la semantica del backend para auditoria y conciliacion.

## Internacionalizacion

Idiomas soportados:

- `en`
- `es`

Los recursos viven en:

```text
src/locales/en/common.json
src/locales/es/common.json
```

Regla general: todo texto visible para usuarios debe usar `t()` y vivir en los archivos de traduccion.

## Performance y bundle

La app usa code splitting conservador a nivel de rutas con `React.lazy()`, `import()` dinamico y `Suspense`.

Se cargan de forma diferida:

- Login
- Dashboard
- Intenciones de pago
- Transacciones rechazadas
- Pagos exitosos
- Reembolsos
- Transacciones
- NotFound

Se mantienen eager los providers, guards, layout principal y rutas base para preservar autenticacion, contexto, tema, tooltip provider y navegacion.

`npm run build` genera tambien:

```text
dist/bundle-stats.html
```

Ese archivo contiene un treemap visual del bundle con tamanos gzip y brotli. Sirve para revisar librerias pesadas y validar que nuevas pantallas no entren accidentalmente al bundle inicial.

Ultima referencia medida despues del split:

- Bundle principal antes: `508.05 kB` minificado, `146.86 kB` gzip.
- Bundle principal despues: `366.52 kB` minificado, `115.97 kB` gzip.
- Reduccion aproximada: `141.53 kB` minificado, `30.89 kB` gzip.

Los chunks generados separan principalmente dashboard, vistas de pagos, login y utilidades compartidas pequenas.

## Calidad y pruebas

Comandos recomendados antes de entregar cambios:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Para ejecutar todo:

```bash
npm run check
```

Pruebas existentes cubren, entre otros puntos:

- Mapper de KPIs del dashboard
- Mapper de distribucion de estados del dashboard
- Servicio de autenticacion
- Configuracion de rutas
- Utilidades de rango UTC para pagos
- Busqueda compartida de pagos

## Convenciones de codigo

- Usar imports con alias `@/` para archivos dentro de `src` cuando encaje con el archivo existente.
- Mantener tipos en `types/` cuando sean contratos de feature.
- No consumir payloads crudos del backend desde vistas; usar mappers.
- Mantener textos visibles en archivos de traduccion.
- Preferir componentes compartidos en `components/ui` o `shared/ui` cuando el patron ya exista.
- Evitar lazy loading en hooks, helpers, botones, inputs o componentes ligeros.
- Ejecutar lint, typecheck, tests y build antes de cerrar cambios.

## Documentacion adicional

Hay documentacion funcional en:

```text
Documentacion.md
doc/Documentacion.md
doc/Documentation.md
```
