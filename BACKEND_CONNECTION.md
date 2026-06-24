# Conexión con comerbosques-backend

Este documento explica cómo el frontend (comerBosques) se comunica con el backend (comerbosques-backend).

---

## Arquitectura general

```
Navegador (localhost:8081)
    │
    │  petición a /api/products
    ▼
Vite Dev Server (proxy)
    │
    │  reenvía a http://localhost:3001
    ▼
SAM Local (Lambda Python en Docker)
    │
    │  lee/escribe
    ▼
DynamoDB en LocalStack (localhost:4566)
```

El frontend **nunca llama directamente a localhost:3001**. Usa rutas relativas (`/api/products`) y Vite las redirige al backend en el servidor. Esto evita problemas de CORS en el navegador.

---

## Archivos involucrados en la conexión

### `.env.local`
```
VITE_API_PROXY_TARGET=http://localhost:3001
VITE_API_URL=http://localhost:3001
```
Define a qué puerto apunta el proxy. Si el backend corre en otro puerto, cambia estos dos valores y reinicia el servidor de Vite.

> Este archivo **no se sube a git** (está en `.gitignore`). Cada desarrollador debe crearlo manualmente.

---

### `vite.config.ts` — proxy
Vite intercepta cualquier petición que empiece con `/api` y la reenvía a `VITE_API_PROXY_TARGET`:

```
GET  /api/products        → http://localhost:3001/api/products
POST /api/products        → http://localhost:3001/api/products
PUT  /api/products/ID     → http://localhost:3001/api/products/ID
DELETE /api/products/ID   → http://localhost:3001/api/products/ID
```

El proxy también elimina los headers `origin` y `referer` antes de reenviar, para que la petición llegue al backend como llamada servidor-a-servidor.

---

### `src/features/comercializadora/productsApi.ts` — cliente HTTP

Las cuatro funciones que usa el Dashboard para hablar con el backend:

| Función | Método | Ruta |
|---|---|---|
| `fetchProducts()` | GET | `/api/products` |
| `createProduct(product)` | POST | `/api/products` |
| `updateProduct(id, product)` | PUT | `/api/products/{id}` |
| `deleteProduct(id)` | DELETE | `/api/products/{id}` |

---

### `src/features/comercializadora/views/DashboardView.tsx` — cuándo se llaman

| Acción del usuario | Qué llama al backend |
|---|---|
| Carga la página | `fetchProducts()` — si el backend devuelve datos, reemplaza el estado local |
| Crea un producto | `createProduct(producto)` |
| Edita un producto | `updateProduct(id, producto)` |
| Elimina un producto | `deleteProduct(id)` |
| Agrega stock | `updateProduct(id, productoActualizado)` |

---

## Estrategia de datos: local + backend

El Dashboard usa **dos fuentes de datos en paralelo**:

1. **localStorage** — cache local en el navegador. Actualización inmediata, sin red.
2. **Backend (DynamoDB)** — persistencia real. Las llamadas son "fire and forget" (`.catch(() => {})` — si fallan, el estado local ya se actualizó).

Al cargar la página:
- Primero muestra lo que hay en localStorage (instantáneo).
- Luego llama al backend. Si hay datos, los usa y sobreescribe el estado local.

Esto significa que si el backend no está corriendo, la app sigue funcionando con los datos guardados localmente en el navegador.

---

## Cómo levantar el backend (resumen)

Ver instrucciones completas en [comerbosques-backend/README.md](../comerbosques-backend/README.md).

Versión rápida — necesitas **tres terminales**:

**Terminal 1** (una sola vez, luego se libera):
```powershell
cd ..\comerbosques-backend
docker compose up -d
aws dynamodb create-table `
  --table-name Products `
  --attribute-definitions AttributeName=id,AttributeType=S `
  --key-schema AttributeName=id,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --endpoint-url http://localhost:4566 `
  --region us-east-1
```

**Terminal 2** (debe quedar abierta siempre):
```powershell
cd ..\comerbosques-backend
sam build
sam local start-api --docker-network comerbosques --port 3001
```

**Terminal 3** (este proyecto, debe quedar abierta siempre):
```powershell
npm run dev
```

Abre el navegador en **http://localhost:8081**.

---

## Configurar el .env.local (primera vez)

Crea el archivo `.env.local` en la raíz de este proyecto con este contenido exacto:

```
VITE_API_PROXY_TARGET=http://localhost:3001
VITE_API_URL=http://localhost:3001
```

Después de crearlo o modificarlo, reinicia el servidor de Vite (`Ctrl+C` y `npm run dev`).

---

## Solución de problemas

**Los productos que creo no aparecen en DynamoDB**
- Asegúrate de acceder por `http://localhost:8081` (no por la IP de red `192.168.x.x`).
- Verifica que SAM esté corriendo en el puerto 3001.
- Revisa `F12 → Network` y busca el POST a `/api/products`. Debe retornar `201`.

**Al cargar la página no trae productos del backend**
- El backend puede estar detenido. La app muestra lo que hay en localStorage.
- Verifica que SAM responde: abre `http://localhost:3001/api/products` en el navegador o ejecuta `Invoke-RestMethod http://localhost:3001/api/products` en PowerShell.

**Error 404 en `/api/products`**
- Otro proceso está ocupando el puerto 3001. Cambia el puerto en `samconfig.toml` del backend y en `.env.local` de este proyecto.
- Asegúrate de reiniciar `npm run dev` después de cambiar `.env.local`.

**El backend responde pero el proxy no redirige**
- Asegúrate de que `.env.local` existe en la raíz del proyecto (junto a `package.json`).
- Reinicia el servidor de Vite — los cambios de `.env.local` no se aplican en caliente.
