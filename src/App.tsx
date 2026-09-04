import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '@azure/msal-react';
import { useUserRole } from './hooks/useUserRole';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Catalog from './pages/Catalog';
import Reports from './pages/Reports';
import Audit from './pages/Audit';
import type { JSX } from 'react/jsx-runtime';

// Componente guardián de rutas autenticadas y autorizadas
function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: JSX.Element; 
  allowedRoles?: string[] 
}) {
  const isAuthenticated = useIsAuthenticated();
  const { hasAnyRole } = useUserRole();

  // 1. Si no está autenticado en Azure AD, va directo al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si la ruta restringe roles y el usuario no posee ninguno de ellos, va al Dashboard
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirección inicial según estado de sesión */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />

        {/* Dashboard: accesible por cualquier usuario autenticado */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Reservas: Admin, Recepcionista, Huésped */}
        <Route 
          path="/reservations" 
          element={
            <ProtectedRoute allowedRoles={["Admin", "Recepcionista", "Huesped", "Huésped"]}>
              <Reservations />
            </ProtectedRoute>
          } 
        />

        {/* Catálogo: Admin, Recepcionista */}
        <Route 
          path="/catalog" 
          element={
            <ProtectedRoute allowedRoles={["Admin", "Recepcionista"]}>
              <Catalog />
            </ProtectedRoute>
          } 
        />

        {/* Reportería: solo Admin */}
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Reports />
            </ProtectedRoute>
          } 
        />

        {/* Auditoría: Admin, Auditor */}
        <Route 
          path="/audit" 
          element={
            <ProtectedRoute allowedRoles={["Admin", "Auditor"]}>
              <Audit />
            </ProtectedRoute>
          } 
        />

        {/* Ruta comodín ante enlaces inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}