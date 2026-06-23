# Setup — comerBosques (frontend)

Este proyecto consume productos desde DynamoDB a través del backend `comerbosques-backend`.
Sin el backend corriendo, la app carga datos desde localStorage como fallback.

---

## Requisitos previos

- Node.js v18+: https://nodejs.org/
- Tener clonado y corriendo `comerbosques-backend` (ver su README)

---

## Pasos para arrancar

**1. Instalar dependencias:**
```bash
npm install
```

**2. Crear el archivo de variables de entorno:**

El archivo `.env.local` no se sube al repo. Créalo manualmente copiando el ejemplo:

```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# Mac / Linux
cp .env.example .env.local
```

El contenido de `.env.local` debe ser:
```
VITE_API_PROXY_TARGET=http://localhost:3000
```

> Ese valor apunta al servidor backend que corre en tu máquina local. No lo cambies a menos que el backend esté en otro puerto.

**3. Arrancar el frontend:**
```bash
npm run dev
```

Abre: **http://localhost:8081**

---

## Orden correcto para trabajar

Antes de abrir el frontend, asegúrate de tener corriendo en otras terminales:

| Terminal | Carpeta | Comando |
|---|---|---|
| 1 | `comerbosques-backend` | `docker compose up` |
| 2 | `comerbosques-backend` | `npm start` |
| 3 | `comerBosques` | `npm run dev` |

---

## Archivos que se modificaron para conectar con DynamoDB

| Archivo | Qué hace |
|---|---|
| [.env.local](.env.local) | Apunta el proxy de Vite al backend (no se sube al repo) |
| [src/features/comercializadora/productsApi.ts](src/features/comercializadora/productsApi.ts) | Funciones para llamar la API del backend |
| [src/features/comercializadora/views/DashboardView.tsx](src/features/comercializadora/views/DashboardView.tsx) | Carga productos desde DynamoDB; sincroniza crear, editar, eliminar y agregar stock |
| [src/features/comercializadora/views/ClienteView.tsx](src/features/comercializadora/views/ClienteView.tsx) | Carga productos desde DynamoDB; sincroniza stock al confirmar compra |
