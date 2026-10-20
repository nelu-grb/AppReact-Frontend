import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Catalog from './pages/Catalog';
import Reports from './pages/Reports';
import Audit from './pages/Audit';
import PaymentResult from './pages/PaymentResult';

/**
 * Componente de carga que se muestra durante la verificación de sesión y roles
 */
function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F4F6F9] font-sans">
      <div className="text-center">
        <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
        <span className="text-lg font-semibold text-gray-700">Verificando permisos...</span>
      </div>
    </div>
  );
}

/**
 * Guardián de rutas protegidas por autenticación y roles
 */
function ProtectedRoute({ 
  allowedRoles 
}: { 
  allowedRoles?: string[];
}) {
  const { inProgress, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  
  // 1. Extraemos 'rolesLoading' del contexto de autenticación
  const { hasAnyRole, rolesLoading } = useAuth();

  // 2. Si MSAL está procesando O el contexto aún está cargando roles, mostramos el spinner
  if (inProgress !== InteractionStatus.None || rolesLoading) {
    return <LoadingScreen />;
  }

  // 3. Si no está autenticado, redirigimos al Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 4. Si la cuenta aún no se ha activado, esperamos
  if (accounts.length === 0) {
    return <LoadingScreen />;
  }

  // 5. Ahora que rolesLoading es FALSE, evaluamos de forma segura los permisos
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default function App() {
  const { inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const { rolesLoading } = useAuth();

  // Evitamos renderizar las rutas si MSAL o el AuthContext se están inicializando
  if (inProgress !== InteractionStatus.None || rolesLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />

        {/* Rutas privadas */}
        <Route element={<ProtectedRoute />}>
          
          {/* Ruta de pago en pantalla completa */}
          <Route path="/payment-result" element={<PaymentResult />} />

          {/* Rutas con menú lateral */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route element={<ProtectedRoute allowedRoles={["Admin", "Recepcionista", "Huesped", "Huésped"]} />}>
              <Route path="/reservations" element={<Reservations />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Admin", "Recepcionista", "Huesped", "Huésped"]} />}>
              <Route path="/catalog" element={<Catalog />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
              <Route path="/reports" element={<Reports />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Admin", "Auditor"]} />}>
              <Route path="/audit" element={<Audit />} />
            </Route>
          </Route>
        </Route>

        {/* Redirecciones universales */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}