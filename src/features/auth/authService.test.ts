import { apiClient } from "@/shared/api/apiClient";
import i18n from "@/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { servicioAutenticacion } from "./authService";

vi.mock("@/shared/api/apiClient", () => ({
  apiClient: vi.fn(),
}));

const mockApiClient = vi.mocked(apiClient);
const PASSWORD_DE_PRUEBA = "password-de-prueba-no-real";

const crearJwt = (payload: Record<string, unknown>): string => {
  const toBase64Url = (value: unknown) =>
    Buffer.from(JSON.stringify(value))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");

  return `${toBase64Url({ alg: "none", typ: "JWT" })}.${toBase64Url(payload)}.firma`;
};

describe("servicioAutenticacion", () => {
  beforeEach(async () => {
    await servicioAutenticacion.cerrarSesion();
    window.localStorage.removeItem("magictronic.i18nextLng");
    window.localStorage.removeItem("i18nextLng");
    mockApiClient.mockReset();
  });

  it("inicia sesion con el endpoint real y guarda el token solo en memoria", async () => {
    const token = crearJwt({
      sub: "dashboard.user@example.com",
      roles: ["ROLE_ANALYTICS"],
      iat: 1,
      exp: 9_999_999_999,
    });

    mockApiClient.mockResolvedValueOnce({
      accessToken: token,
      tokenType: "Bearer",
      expiresIn: 3600,
    });

    const sesion = await servicioAutenticacion.iniciarSesion({
      email: " dashboard.user@example.com ",
      password: PASSWORD_DE_PRUEBA,
    });

    expect(mockApiClient).toHaveBeenCalledWith("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "dashboard.user@example.com",
        password: PASSWORD_DE_PRUEBA,
      }),
      skipAuthHeader: true,
    });
    expect(sesion.correo).toBe("dashboard.user@example.com");
    expect(sesion.usuario.role).toBe("client");
    expect(window.localStorage.getItem("__auth_session")).toBeNull();
    await expect(servicioAutenticacion.estaAutenticado()).resolves.toBe(true);
  });

  it("muestra un mensaje claro cuando backend responde 403", async () => {
    mockApiClient.mockRejectedValueOnce({
      status: 403,
      message: "Forbidden",
    });

    await expect(
      servicioAutenticacion.iniciarSesion({
        email: "dashboard.user@example.com",
        password: "bad-password",
      }),
    ).rejects.toThrow("No tienes permiso");
  });

  it("limpia la sesion si el token expiro y no hay refresh token", async () => {
    const token = crearJwt({
      sub: "dashboard.user@example.com",
      roles: ["ROLE_USER"],
      iat: 1,
      exp: 2,
    });

    mockApiClient.mockResolvedValueOnce({
      accessToken: token,
      tokenType: "Bearer",
      expiresIn: -1,
    });

    await servicioAutenticacion.iniciarSesion({
      email: "dashboard.user@example.com",
      password: PASSWORD_DE_PRUEBA,
    });

    await expect(servicioAutenticacion.obtenerSesion()).resolves.toBeNull();
    await expect(servicioAutenticacion.estaAutenticado()).resolves.toBe(false);
  });

  it("restaura idioma ingles al cerrar sesion aunque falle el endpoint logout", async () => {
    window.localStorage.setItem("magictronic.i18nextLng", "es");
    window.localStorage.setItem("i18nextLng", "es");
    await i18n.changeLanguage("es");

    mockApiClient.mockRejectedValueOnce({
      status: 500,
      message: "Logout failed",
    });

    await expect(servicioAutenticacion.cerrarSesion()).resolves.toBeUndefined();

    expect(window.localStorage.getItem("magictronic.i18nextLng")).toBe("en");
    expect(window.localStorage.getItem("i18nextLng")).not.toBe("es");
    expect(i18n.language.startsWith("en")).toBe(true);
  });
});
