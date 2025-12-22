import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  FileText,
  HelpCircle,
  ChevronRight,
  Beef,
  CreditCard,
  Mail,
  Calendar,
  BookOpen,
} from "lucide-react";
import { cn } from "../../../utils/cn";

const mainNavItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Productos", path: "/products", icon: Package },
  { name: "Ventas", path: "/sales", icon: ShoppingCart },
  { name: "Clientes", path: "/customers", icon: Users },
  { name: "Reportes", path: "/reports", icon: TrendingUp },
  { name: "Facturas", path: "/invoices", icon: BookOpen },
];

const settingsItems = [
  { name: "Billetera", path: "/wallet", icon: CreditCard },
  { name: "Mis Contactos", path: "/contacts", icon: Mail },
  { name: "Facturas", path: "/billing", icon: FileText },
  { name: "Agenda", path: "/schedule", icon: Calendar },
];

export const DesktopSidebar = () => {
  return (
    <aside className="w-64 h-full bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Logo / Brand */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Beef className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Carnicería</h2>
              <p className="text-sm font-semibold text-red-600">"La Picota"</p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 px-4 py-6 space-y-8">
          <nav className="space-y-1">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Main Navigation
            </p>
            {mainNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                    isActive
                      ? "text-indigo-700 font-semibold bg-indigo-50/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Barra lateral de indicador activo */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full"></div>
                    )}

                    <item.icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-indigo-600"
                          : "text-slate-500 group-hover:text-slate-700"
                      )}
                    />

                    <span className="text-sm flex-1">{item.name}</span>

                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Settings & Schedules */}
          <nav className="space-y-1 pt-6 border-t border-slate-200">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Settings & Schedules
            </p>
            {settingsItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                    isActive
                      ? "text-indigo-700 font-semibold bg-indigo-50/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Barra lateral de indicador activo */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full"></div>
                    )}

                    <item.icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-indigo-600"
                          : "text-slate-500 group-hover:text-slate-700"
                      )}
                    />

                    <span className="text-sm flex-1">{item.name}</span>

                    <ChevronRight
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive
                          ? "text-indigo-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Help Center Card */}
        <div className="p-4 m-4 mb-6 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl relative overflow-hidden shadow-lg">
          {/* Círculo decorativo */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full"></div>

          <div className="relative z-10 text-center">
            {/* Ícono */}
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
              <HelpCircle className="w-6 h-6 text-orange-600" />
            </div>

            {/* Título y texto */}
            <h3 className="text-white font-bold text-sm mb-2">
              Centro de Ayuda
            </h3>
            <p className="text-white/90 text-xs leading-relaxed mb-4">
              ¿Tienes problemas? Contáctanos para más información.
            </p>

            {/* Botón */}
            <button className="w-full bg-white text-orange-600 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-orange-50 transition-colors shadow-sm hover:shadow-md">
              Ir al Centro de Ayuda
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
