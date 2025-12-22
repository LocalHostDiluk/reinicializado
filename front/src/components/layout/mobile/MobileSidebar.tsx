import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  FileText,
  Settings,
  X,
} from "lucide-react";
import { cn } from "../../../utils/cn";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Productos", path: "/products", icon: Package },
  { name: "Ventas", path: "/sales", icon: ShoppingCart },
  { name: "Clientes", path: "/customers", icon: Users },
  { name: "Reportes", path: "/reports", icon: TrendingUp },
  { name: "Facturas", path: "/invoices", icon: FileText },
  { name: "Configuración", path: "/settings", icon: Settings },
];

export const MobileSidebar = ({ isOpen, onClose }: MobileSidebarProps) => {
  return (
    <aside
      className={cn(
        "fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 transition-transform duration-300 z-40 overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-4 space-y-6">
        {/* Header con botón cerrar */}
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-bold text-slate-900">Menú</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose} // ✅ Cierra al hacer clic en link
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};
