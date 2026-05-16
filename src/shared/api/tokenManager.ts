/**
 * Token Manager
 *
 * Guarda JWT y refresh token solo en memoria. Esto evita dejarlos en
 * localStorage, donde cualquier script del navegador podria leerlos.
 */

import { ENV } from "@/shared/config/env";

interface TokenPair {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

let tokens: TokenPair = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
};

const REFRESH_SKEW_MS = ENV.TOKEN_REFRESH_SKEW_MS;

export const tokenManager = {
  setTokens(accessToken: string, refreshToken?: string, expiresIn?: number): void {
    tokens = {
      accessToken,
      refreshToken: refreshToken ?? null,
      expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
    };
  },

  getToken(): string | null {
    // En desarrollo, permitir un token de desarrollo inyectado vía env
    // `VITE_DEV_TOKEN` para facilitar pruebas locales sin pasar por UI.
    if (!tokens.accessToken && ENV.DEV_TOKEN && ENV.IS_DEV) {
      return ENV.DEV_TOKEN;
    }

    return tokens.accessToken;
  },

  getRefreshToken(): string | null {
    return tokens.refreshToken;
  },

  isTokenExpired(): boolean {
    if (!tokens.expiresAt) {
      return false;
    }

    return Date.now() >= tokens.expiresAt - REFRESH_SKEW_MS;
  },

  clearTokens(): void {
    tokens = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    };
  },
};
