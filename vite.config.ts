import { fileURLToPath, URL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, type ProxyOptions, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

const DEFAULT_DEV_SERVER_PORT = 8081;
const CORS_PREFLIGHT_MAX_AGE_SECONDS = 3600;
const API_PROXY_PREFIX = "/api";

type DevCustomer = {
  id: string;
  fullName: string;
  phone: string;
  merchantKey: string;
  termsAccepted: boolean;
  createdAt: string;
  updatedAt?: string;
  status: "active" | "inactive";
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    references?: string;
  };
};

const devCustomers: DevCustomer[] = [];

const configurarProxyBackend: ProxyOptions["configure"] = (proxy) => {
  proxy.on("proxyReq", (proxyReq) => {
    // Refuerzo para que el proxy no reenvie el origen local al backend.
    proxyReq.removeHeader("origin");
    proxyReq.removeHeader("referer");
  });
};

// Plugin para manejar CORS preflight requests
const corsPlugin = () => ({
  name: "cors-preflight",
  configureServer(server: ViteDevServer) {
    server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const isApiRequest = req.url?.startsWith(API_PROXY_PREFIX);

      if (isApiRequest) {
        // El backend valida CORS. En desarrollo el navegador habla con Vite y
        // Vite reenvia al backend, asi que limpiamos el origen local antes del
        // proxy para que llegue como una llamada servidor-a-servidor.
        delete req.headers.origin;
        delete req.headers.referer;
      }

      if (isApiRequest && req.method === "OPTIONS") {
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": String(CORS_PREFLIGHT_MAX_AGE_SECONDS),
        });
        res.end();
        return;
      }

      next();
    });
  },
});

const readRequestBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  return rawBody ? JSON.parse(rawBody) : {};
};

const sendJson = (res: ServerResponse, statusCode: number, body: Record<string, unknown>) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
};

const getCustomerApiRoute = (url?: string) => {
  if (!url) {
    return null;
  }

  const path = url.split("?")[0];

  if (path === "/api/customers" || path === "/api/customers/register") {
    return { path, id: null };
  }

  const match = path.match(/^\/api\/customers\/([^/]+)$/);

  return match ? { path, id: decodeURIComponent(match[1]) } : null;
};

const getString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const getCustomerPayload = (body: Record<string, unknown>) => {
  const address = (body.address ?? {}) as Record<string, unknown>;

  return {
    fullName: getString(body.fullName),
    phone: getString(body.phone),
    merchantKey: getString(body.merchantKey),
    termsAccepted: Boolean(body.termsAccepted ?? true),
    address: {
      street: getString(address.street),
      number: getString(address.number),
      neighborhood: getString(address.neighborhood),
      city: getString(address.city),
      state: getString(address.state),
      postalCode: getString(address.postalCode),
      country: getString(address.country),
      references: getString(address.references) || undefined,
    },
  };
};

const validateDevCustomer = (customer: ReturnType<typeof getCustomerPayload>) => {
  const missingAddress =
    !customer.address.street ||
    !customer.address.number ||
    !customer.address.neighborhood ||
    !customer.address.city ||
    !customer.address.state ||
    !customer.address.postalCode ||
    !customer.address.country;

  if (!customer.fullName || !customer.phone || !customer.merchantKey || missingAddress) {
    return "Faltan datos obligatorios del cliente";
  }

  if (!/^\+[1-9]\d{7,14}$/.test(customer.phone)) {
    return "El telefono debe estar en formato E.164";
  }

  return null;
};

const customerRegistrationDevPlugin = () => ({
  name: "customers-dev-api",
  configureServer(server: ViteDevServer) {
    server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const route = getCustomerApiRoute(req.url);

      if (!route) {
        next();
        return;
      }

      if (req.method === "OPTIONS") {
        res.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": String(CORS_PREFLIGHT_MAX_AGE_SECONDS),
        });
        res.end();
        return;
      }

      if (req.method === "GET" && route.id === null) {
        sendJson(res, 200, { customers: devCustomers });
        return;
      }

      if (req.method === "DELETE" && route.id) {
        const customerIndex = devCustomers.findIndex((customer) => customer.id === route.id);

        if (customerIndex === -1) {
          sendJson(res, 404, { message: "Cliente no encontrado" });
          return;
        }

        devCustomers.splice(customerIndex, 1);
        sendJson(res, 200, { message: "Cliente eliminado correctamente" });
        return;
      }

      try {
        const body = (await readRequestBody(req)) as Record<string, unknown>;
        const payload = getCustomerPayload(body);
        const validationError = validateDevCustomer(payload);

        if (validationError) {
          sendJson(res, 400, { message: validationError });
          return;
        }

        if (req.method === "POST" && route.id === null) {
          const now = new Date().toISOString();
          const customer: DevCustomer = {
            id: `dev-${Date.now()}`,
            ...payload,
            createdAt: now,
            updatedAt: now,
            status: "active",
          };

          devCustomers.unshift(customer);
          sendJson(res, 201, {
            id: customer.id,
            message: "Registro creado correctamente",
            phone: customer.phone,
            merchantKey: customer.merchantKey,
          });
          return;
        }

        if (req.method === "PUT" && route.id) {
          const customerIndex = devCustomers.findIndex((customer) => customer.id === route.id);

          if (customerIndex === -1) {
            sendJson(res, 404, { message: "Cliente no encontrado" });
            return;
          }

          devCustomers[customerIndex] = {
            ...devCustomers[customerIndex],
            ...payload,
            updatedAt: new Date().toISOString(),
          };
          sendJson(res, 200, { message: "Cliente actualizado correctamente" });
          return;
        }

        sendJson(res, 405, { message: "Metodo no permitido" });
      } catch {
        sendJson(res, 400, { message: "No se pudo leer el registro del cliente" });
      }
    });
  },
});

const obtenerOrigenApi = (apiUrl?: string): string | undefined => {
  if (!apiUrl) {
    return undefined;
  }

  try {
    return new URL(apiUrl).origin;
  } catch {
    return undefined;
  }
};

const obtenerPuertoServidor = (value?: string): number => {
  const port = Number(value);

  return Number.isInteger(port) && port > 0 ? port : DEFAULT_DEV_SERVER_PORT;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET ??
    obtenerOrigenApi(env.VITE_API_URL ?? env.VITE_API_BASE_URL);

  const proxy = {
    ...(apiProxyTarget
      ? {
      [API_PROXY_PREFIX]: {
        target: apiProxyTarget,
        changeOrigin: true,
        configure: configurarProxyBackend,
        secure: true,
        rewrite: (path) => path,
      },
    }
      : {}),
  };

  return {
    server: {
      host: "::",
      port: obtenerPuertoServidor(env.VITE_DEV_SERVER_PORT),
      proxy,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      customerRegistrationDevPlugin(),
      corsPlugin(),
      visualizer({
        filename: "dist/bundle-stats.html",
        template: "treemap",
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
