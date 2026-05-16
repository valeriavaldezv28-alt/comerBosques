import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appRoutes } from "@/config/routes";
import { ProveedorModoTema } from "@/features/theme";

const App = () => (
  <ProveedorModoTema>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {appRoutes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element}>
              {route.children?.map((childRoute) => (
                <Route key={childRoute.path} path={childRoute.path} element={childRoute.element} />
              ))}
            </Route>
          ))}
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ProveedorModoTema>
);

export default App;
