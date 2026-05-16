import type { ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appRoutes, type RouteConfig } from "@/config/routes";
import { RutaProtegida, SessionInactivityTimeout } from "@/features/auth";
import { ProveedorModoTema } from "@/features/theme";

const renderRoute = (route: RouteConfig, index: number): ReactNode => {
  const routeElement = route.requiresAuth || route.allowedRoles ? (
    <RutaProtegida allowedRoles={route.allowedRoles}>
      {route.element}
    </RutaProtegida>
  ) : (
    route.element
  );

  return (
    <Route key={`${route.path}-${index}`} path={route.path} element={routeElement}>
      {route.children?.map((childRoute, childIndex) => renderRoute(childRoute, childIndex))}
    </Route>
  );
};

const App = () => (
  <ProveedorModoTema>
    <TooltipProvider>
      <BrowserRouter>
        <SessionInactivityTimeout />
        <Routes>{appRoutes.map((route, index) => renderRoute(route, index))}</Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ProveedorModoTema>
);

export default App;
