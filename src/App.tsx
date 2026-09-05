import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { useUserRole } from './hooks/useUserRole';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Catalog from './pages/Catalog';
import Reports from './pages/Reports';
import Audit from './pages/Audit';

function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactElement; 
  allowedRoles?: string[];
}) {
  const { inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const { hasAnyRole } = useUserRole();

  if (inProgress !== InteractionStatus.None) {
    return null; // Espera en silencio sin redirigir
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
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
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute allowedRoles={["Admin", "Recepcionista", "Huesped", "Huésped"]}><Reservations /></ProtectedRoute>} />
        <Route path="/catalog" element={<ProtectedRoute allowedRoles={["Admin", "Recepcionista"]}><Catalog /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={["Admin"]}><Reports /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute allowedRoles={["Admin", "Auditor"]}><Audit /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}