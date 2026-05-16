import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRoutes } from "./routes";
import { PROTECTED_ROUTE_PATHS, ROUTE_PATHS } from "./routePaths";
import { RutaProtegida } from "../features/auth";
import { ROLES } from "../features/auth/roles";

const mockUseAuth = vi.fn();

vi.mock("../features/auth/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

const UbicacionActual = () => {
  const location = useLocation();

  return <span data-testid="ruta-actual">{location.pathname}</span>;
};

describe("appRoutes", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  const routerFutureFlags = {
    v7_relativeSplatPath: true,
    v7_startTransition: true,
  } as const;

  it("centraliza el layout protegido y los roles por ruta", () => {
    const raizProtegida = appRoutes.find((route) => route.path === ROUTE_PATHS.root && route.children);

    expect(raizProtegida?.requiresAuth).toBe(true);
    expect(raizProtegida?.children).toHaveLength(6);

    const transacciones = raizProtegida?.children?.find((route) => route.path === PROTECTED_ROUTE_PATHS.transactions);
    const paymentIntents = raizProtegida?.children?.find((route) => route.path === PROTECTED_ROUTE_PATHS.paymentIntents);
    const rejectedTransactions = raizProtegida?.children?.find((route) => route.path === PROTECTED_ROUTE_PATHS.rejectedTransactions);
    const successfulPayments = raizProtegida?.children?.find((route) => route.path === PROTECTED_ROUTE_PATHS.successfulPayments);
    const refunds = raizProtegida?.children?.find((route) => route.path === PROTECTED_ROUTE_PATHS.refunds);

    expect(transacciones?.requiresAuth).toBe(true);
    expect(transacciones?.allowedRoles).toEqual([ROLES.ADMIN, ROLES.CLIENT]);
    expect(paymentIntents?.requiresAuth).toBe(true);
    expect(paymentIntents?.allowedRoles).toEqual([ROLES.ADMIN, ROLES.CLIENT]);
    expect(rejectedTransactions?.requiresAuth).toBe(true);
    expect(rejectedTransactions?.allowedRoles).toEqual([ROLES.ADMIN, ROLES.CLIENT]);
    expect(successfulPayments?.requiresAuth).toBe(true);
    expect(successfulPayments?.allowedRoles).toEqual([ROLES.ADMIN, ROLES.CLIENT]);
    expect(refunds?.requiresAuth).toBe(true);
    expect(refunds?.allowedRoles).toEqual([ROLES.ADMIN, ROLES.CLIENT]);
  });

  it("redirige a login cuando no hay sesion", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isHydrated: true,
      isCheckingAuth: false,
    });

    render(
      <MemoryRouter initialEntries={[ROUTE_PATHS.dashboard]} future={routerFutureFlags}>
        <Routes>
          <Route path={ROUTE_PATHS.login} element={<UbicacionActual />} />
          <Route
            path={ROUTE_PATHS.dashboard}
            element={
              <RutaProtegida>
                <div>Dashboard</div>
              </RutaProtegida>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("ruta-actual")).toHaveTextContent(ROUTE_PATHS.login);
  });

  it("permite temporalmente acceso a transactions para cliente", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: ROLES.CLIENT },
      isHydrated: true,
      isCheckingAuth: false,
    });

    render(
      <MemoryRouter initialEntries={[ROUTE_PATHS.transactions]} future={routerFutureFlags}>
        <Routes>
          <Route path={ROUTE_PATHS.dashboard} element={<UbicacionActual />} />
          <Route
            path={ROUTE_PATHS.transactions}
            element={
              <RutaProtegida allowedRoles={[ROLES.ADMIN, ROLES.CLIENT]}>
                <div>Transacciones</div>
              </RutaProtegida>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Transacciones")).toBeInTheDocument();
  });
});
