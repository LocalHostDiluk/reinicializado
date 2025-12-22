import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MobileNavbar } from "./MobileNavbar";
import { MobileSidebar } from "./MobileSidebar";

export const MobileLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar Mobile */}
      <MobileNavbar onToggleSidebar={toggleSidebar} />

      {/* Sidebar Drawer */}
      <MobileSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 top-16"
          onClick={closeSidebar}
        />
      )}

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-indigo-100 via-purple-50 to-white">
        <Outlet />
      </main>
    </div>
  );
};
