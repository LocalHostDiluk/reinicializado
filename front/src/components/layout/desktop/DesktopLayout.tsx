import { Outlet } from "react-router-dom";
import { DesktopSidebar } from "./DesktopSidebar";
import { DesktopNavbar } from "./DesktopNavbar";

export const DesktopLayout = () => {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar - siempre abierto */}
      <DesktopSidebar />

      {/* Contenedor derecho */}
      <div className="flex-1 flex flex-col min-h-screen">
        <DesktopNavbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
