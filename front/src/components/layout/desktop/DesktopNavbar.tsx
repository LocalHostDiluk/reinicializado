import { useAuthStore } from "../../../stores/authStore";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  ChevronDown,
  LogOut,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const DesktopNavbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
    navigate("/login");
  };

  return (
    <nav className="relative z-40 bg-white/10 backdrop-blur-xl border-b border-white/20">
      <div className="h-16 px-6 flex items-center justify-between gap-6">
        {/* Left - Barra de búsqueda */}
        <div className="flex items-center gap-3 flex-1 max-w-md bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20 hover:bg-white/15 transition-colors">
          <Search className="w-4 h-4 text-white/70 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-white placeholder:text-white/60 text-sm w-full focus:outline-none"
          />
        </div>

        {/* Center - Links adaptados a carnicería */}
        <div className="hidden lg:flex items-center gap-8">
          <button className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium">
            <DollarSign className="w-4 h-4" />
            <span>Caja</span>
          </button>
          <button className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium">
            <ShoppingCart className="w-4 h-4" />
            <span>Ventas</span>
          </button>
        </div>

        {/* Right - Notificaciones + Usuario */}
        <div className="flex items-center gap-4">
          {/* Notificación */}
          <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>

          {/* Usuario dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <span className="hidden md:block text-sm font-medium text-white">
                Hola, {user?.name?.split(" ")[0]}
              </span>
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-white/70" />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowUserMenu(false)}
                />

                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-2xl py-2 z-40">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">
                      {user?.role}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
