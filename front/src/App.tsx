import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAuthStore } from "./stores/authStore";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Todas las rutas protegidas comparten el MISMO layout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/products"
              element={<div className="p-6">📦 Productos (próximamente)</div>}
            />
            <Route
              path="/sales"
              element={<div className="p-6">🛒 Ventas (próximamente)</div>}
            />
            <Route
              path="/customers"
              element={<div className="p-6">👥 Clientes (próximamente)</div>}
            />
            <Route
              path="/reports"
              element={<div className="p-6">📈 Reportes (próximamente)</div>}
            />
            <Route
              path="/invoices"
              element={<div className="p-6">📄 Facturas (próximamente)</div>}
            />
            <Route
              path="/settings"
              element={
                <div className="p-6">⚙️ Configuración (próximamente)</div>
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
