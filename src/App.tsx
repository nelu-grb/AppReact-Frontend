import React from 'react';
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
import PaymentResult from './pages/PaymentResult'; // <-- Importamos la nueva página

function ProtectedRoute({ 
  allowedRoles 
}: { 
  allowedRoles?: string[];
}) {
  const { inProgress, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const { hasAnyRole } = useAuth();

  if (inProgress !== InteractionStatus.None) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (accounts.length === 0) {
    return null;
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default function App() {
  const { inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  if (inProgress !== InteractionStatus.None) {
    return null;
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
          
          {/* Ruta de pago: Fuera del Layout para que ocupe pantalla completa sin menús laterales */}
          <Route path="/payment-result" element={<PaymentResult />} />

          {/* Rutas con el Layout central (Sidebar, Navbar, etc.) */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route element={<ProtectedRoute allowedRoles={["Admin", "Recepcionista", "Huesped", "Huésped"]} />}>
              <Route path="/reservations" element={<Reservations />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["Admin", "Recepcionista"]} />}>
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

        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}