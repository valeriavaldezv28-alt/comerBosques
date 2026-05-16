import { apiClient } from "@/shared/api/apiClient";
import { API_ENDPOINTS } from "@/shared/api/apiConfig";
import { tokenManager } from "@/shared/api/tokenManager";
import { APP_CONFIG } from "@/shared/config/appConfig";
import i18n from "@/i18n";
import type { RolUsuario } from "./roles";

export interface CredencialesAutenticacion {
  email: string;
  password: string;
}

export interface UsuarioAutenticado {
  correo: string;
  role: RolUsuario;
}

export interface RespuestaLoginApi {
  accessToken: string;
  refreshToken?: string;
  tokenType?: "Bearer" | string;
  expiresIn?: number;
}

export interface SesionAutenticacion {
  correo: string;
  emitidaEn: number;
  expiraEn: number;
  token: string;
  proveedor: "api";
  usuario: UsuarioAutenticado;
}

interface AdaptadorAutenticacion {
  iniciarSesion(
    credenciales: CredencialesAutenticacion,
    t?: TranslationFunction,
  ): Promise<SesionAutenticacion>;

  refrescarToken(): Promise<SesionAutenticacion>;

  cerrarSesion(): Promise<void>;

  obtenerSesion(): Promise<SesionAutenticacion | null>;
}

type JwtPayload = {
  sub?: string;
  roles?: string[];
  authorities?: string[];
  scope?: string;
  role?: string;
  iat?: number;
  exp?: number;
};

type ErrorApi = {
  message: string;
  status: number;
};

const normalizarBase64Url = (value: string): string => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");

  const padding = base64.length % 4;

  return padding ? `${base64}${"=".repeat(4 - padding)}` : base64;
};

const decodificarJwtPayload = (token: string): JwtPayload => {
  const partes = token.split(".");

  if (partes.length !== 3) {
    throw new Error("Token invalido");
  }

  return JSON.parse(atob(normalizarBase64Url(partes[1]))) as JwtPayload;
};

const extraerRolesDelPayload = (payload: JwtPayload): string[] => [
  ...(payload.roles ?? []),
  ...(payload.authorities ?? []),
  ...(payload.scope?.split(" ") ?? []),
  ...(payload.role ? [payload.role] : []),
];

const extraerRolDelPayload = (payload: JwtPayload): RolUsuario => {
  const roles = extraerRolesDelPayload(payload);

  if (roles.includes("ROLE_ADMIN")) {
    return "admin";
  }

  return "client";
};

const construirSesionDesdeToken = (token: string): SesionAutenticacion => {
  const payload = decodificarJwtPayload(token);

  const correo = payload.sub ?? "";

  return {
    correo,
    emitidaEn: (payload.iat ?? 0) * 1000,
    expiraEn: (payload.exp ?? 0) * 1000,
    token,
    proveedor: "api",
    usuario: {
      correo,
      role: extraerRolDelPayload(payload),
    },
  };
};

const esErrorApi = (error: unknown): error is ErrorApi =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  "status" in error &&
  typeof error.message === "string" &&
  typeof error.status === "number";

type LoginErrorKey =
  | "login.errors.invalidData"
  | "login.errors.unauthorized"
  | "login.errors.forbidden"
  | "login.errors.tooManyAttempts"
  | "login.errors.requestTimeout"
  | "login.errors.serverError"
  | "login.errors.connectionFailed"
  | "login.errors.generic"
  | "login.errors.missingToken";

type TranslationFunction = (key: LoginErrorKey) => string;

const loginErrorFallbacks: Record<LoginErrorKey, string> = {
  "login.errors.invalidData": "Datos invalidos. Verifica email y contrasena.",
  "login.errors.unauthorized": "Email o contrasena incorrectos.",
  "login.errors.forbidden":
    "No tienes permiso para iniciar sesion con estas credenciales.",
  "login.errors.tooManyAttempts":
    "Demasiados intentos. Intenta en unos minutos.",
  "login.errors.requestTimeout":
    "La solicitud tardo demasiado. Intenta de nuevo.",
  "login.errors.serverError": "Algo salio mal. Intenta de nuevo.",
  "login.errors.connectionFailed":
    "No pudimos conectar. Revisa tu conexion a internet.",
  "login.errors.generic": "Error al iniciar sesion. Intenta de nuevo.",
  "login.errors.missingToken": "Algo salio mal. Intenta de nuevo.",
};

const loginErrorFallbacksEn: Record<LoginErrorKey, string> = {
  "login.errors.invalidData": "Check your email and password.",
  "login.errors.unauthorized": "Email or password is incorrect.",
  "login.errors.forbidden": "You do not have access to this dashboard.",
  "login.errors.tooManyAttempts":
    "Too many attempts. Please try again in a few minutes.",
  "login.errors.requestTimeout":
    "The request took too long. Please try again.",
  "login.errors.serverError": "Something went wrong. Please try again.",
  "login.errors.connectionFailed":
    "Unable to connect. Check your internet connection.",
  "login.errors.generic": "Something went wrong. Please try again.",
  "login.errors.missingToken": "Something went wrong. Please try again.",
};

const contieneDetalleTecnico = (mensaje: string): boolean =>
  [
    "axios",
    "backend",
    "authentication server",
    "configuracion",
    "configuración",
    "error al iniciar sesion",
    "error al iniciar sesión",
    "failed to fetch",
    "network error",
    "request timeout",
    "server error",
    "servidor de autenticación",
    "sign in error",
    "stack",
    "token",
    "undefined",
    "url",
  ].some((detalle) => mensaje.toLowerCase().includes(detalle));

const traducirErrorLogin = (
  key: LoginErrorKey,
  t?: TranslationFunction,
): string => {
  const mensajeTraducido = t?.(key);

  if (
    mensajeTraducido &&
    mensajeTraducido !== key &&
    !contieneDetalleTecnico(mensajeTraducido)
  ) {
    return mensajeTraducido;
  }

  return t ? loginErrorFallbacksEn[key] : loginErrorFallbacks[key];
};

const manejarErrorLogin = (error: unknown, t?: TranslationFunction): never => {
  console.error("Login failed", error);

  if (esErrorApi(error)) {
    const conexionFallida =
      error.message.toLowerCase().includes("offline") ||
      error.message.toLowerCase().includes("failed to fetch") ||
      error.message.toLowerCase().includes("network error");

    if (conexionFallida) {
      throw new Error(traducirErrorLogin("login.errors.connectionFailed", t));
    }

    if (error.status === 408) {
      throw new Error(traducirErrorLogin("login.errors.requestTimeout", t));
    }

    if (error.status === 400) {
      throw new Error(traducirErrorLogin("login.errors.invalidData", t));
    }

    if (error.status === 401) {
      throw new Error(traducirErrorLogin("login.errors.unauthorized", t));
    }

    if (error.status === 403) {
      throw new Error(traducirErrorLogin("login.errors.forbidden", t));
    }

    if (error.status === 429) {
      throw new Error(traducirErrorLogin("login.errors.tooManyAttempts", t));
    }

    if (error.status >= 500) {
      throw new Error(traducirErrorLogin("login.errors.serverError", t));
    }
  }

  if (error instanceof Error) {
    if (
      error.message.toLowerCase().includes("failed to fetch") ||
      error.message.toLowerCase().includes("network error")
    ) {
      throw new Error(traducirErrorLogin("login.errors.connectionFailed", t));
    }

    throw new Error(traducirErrorLogin("login.errors.generic", t));
  }

  throw new Error(traducirErrorLogin("login.errors.generic", t));
};

const validarRespuestaLogin = (
  respuesta: RespuestaLoginApi,
  t?: TranslationFunction,
): void => {
  if (!respuesta.accessToken) {
    throw new Error(traducirErrorLogin("login.errors.missingToken", t));
  }
};

const adaptadorAutenticacionApi: AdaptadorAutenticacion = {
  async iniciarSesion(credenciales, t) {
    try {
      const respuesta = await apiClient<RespuestaLoginApi>(
        API_ENDPOINTS.auth.login,
        {
          method: "POST",

          body: JSON.stringify({
            email: credenciales.email.trim(),
            password: credenciales.password,
          }),

          skipAuthHeader: true,
        },
      );

      validarRespuestaLogin(respuesta, t);

      tokenManager.setTokens(
        respuesta.accessToken,
        respuesta.refreshToken,
        respuesta.expiresIn,
      );

      return construirSesionDesdeToken(respuesta.accessToken);
    } catch (error) {
      return manejarErrorLogin(error, t);
    }
  },

  async refrescarToken() {
    const refreshToken = tokenManager.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const respuesta = await apiClient<RespuestaLoginApi>(
        API_ENDPOINTS.auth.refresh,
        {
          method: "POST",

          body: JSON.stringify({
            refreshToken,
          }),

          skipAuthHeader: true,
        },
      );

      validarRespuestaLogin(respuesta);

      tokenManager.setTokens(
        respuesta.accessToken,
        respuesta.refreshToken ?? refreshToken,
        respuesta.expiresIn,
      );

      return construirSesionDesdeToken(respuesta.accessToken);
    } catch (error) {
      tokenManager.clearTokens();

      throw error;
    }
  },

  async cerrarSesion() {
    try {
      await apiClient(API_ENDPOINTS.auth.logout, {
        method: "POST",
      });
    } catch {
      // El cierre local debe continuar aunque el backend no responda.
    } finally {
      tokenManager.clearTokens();
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(APP_CONFIG.LANGUAGE_STORAGE_KEY);
          // Compatibilidad con la clave por defecto de i18next en sesiones antiguas.
          window.localStorage.removeItem(APP_CONFIG.LEGACY_LANGUAGE_STORAGE_KEY);
        }
      } catch {
        // El logout local no depende de que storage este disponible.
      }

      try {
        await i18n.changeLanguage(APP_CONFIG.DEFAULT_LANGUAGE);
      } catch {
        // La sesion ya fue limpiada aunque i18n no pueda cambiar idioma.
      }
    }
  },

  async obtenerSesion() {
    const token = tokenManager.getToken();

    if (!token) {
      return null;
    }

    try {
      if (tokenManager.isTokenExpired()) {
        return await this.refrescarToken();
      }

      return construirSesionDesdeToken(token);
    } catch {
      tokenManager.clearTokens();

      return null;
    }
  },
};

export const servicioAutenticacion = {
  iniciarSesion(
    credenciales: CredencialesAutenticacion,
    t?: TranslationFunction,
  ) {
    return adaptadorAutenticacionApi.iniciarSesion(credenciales, t);
  },

  refrescarToken() {
    return adaptadorAutenticacionApi.refrescarToken();
  },

  cerrarSesion() {
    return adaptadorAutenticacionApi.cerrarSesion();
  },

  obtenerSesion() {
    return adaptadorAutenticacionApi.obtenerSesion();
  },

  async estaAutenticado() {
    const sesion = await adaptadorAutenticacionApi.obtenerSesion();

    return sesion !== null;
  },
};
