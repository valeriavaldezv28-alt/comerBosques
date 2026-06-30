import { useEffect, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ROUTE_PATHS } from "@/config/routePaths";
import { AppFooter } from "./AppFooter";
import { BarraLateral } from "./Sidebar";
import { BarraSuperior } from "./Topbar";

export const DashboardLayout = ({ children }: { children?: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isProductNewView = location.pathname === ROUTE_PATHS.dashboardProductsNew;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((currentValue) => !currentValue);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen w-full bg-[#f6f8fb]">
      <BarraLateral mode="desktop" />
      <BarraLateral mode="mobile" isOpen={isSidebarOpen} onClose={closeSidebar} onNavigate={closeSidebar} />

      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior isSidebarOpen={isSidebarOpen} onMenuClick={toggleSidebar} />

        <main className={isProductNewView ? "flex-1" : "flex-1 space-y-4 p-3 sm:p-4 lg:p-5"}>
          {children ?? <Outlet />}
        </main>
        {!isProductNewView && <AppFooter className="px-4 pb-4 lg:px-5" />}
      </div>
    </div>
  );
};
