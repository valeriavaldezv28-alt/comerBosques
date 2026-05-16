import { fileURLToPath, URL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, type ProxyOptions, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

const DEFAULT_DEV_SERVER_PORT = 8081;
const CORS_PREFLIGHT_MAX_AGE_SECONDS = 3600;
const API_PROXY_PREFIX = "/api";

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
