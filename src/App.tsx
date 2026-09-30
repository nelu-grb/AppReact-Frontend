import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Catalog from './pages/Catalog';
import Reports from './pages/Reports';
import Audit from './pages/Audit';
import PaymentResult from './pages/PaymentResult';

// Componente ProtectedRoute MOCKEADO (desactivado temporalmente para pruebas locales)
function ProtectedRoute({ 
  allowedRoles 
}: { 
  allowedRoles?: string[];
}) {
  // Retorna las rutas hijas directamente omitiendo validaciones de Azure y Roles
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />
        <Route path="/payment/result" element={<PaymentResult />} />

        {/* Rutas con Layout habilitadas sin autenticación para desarrollo */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<Audit />} />
          </Route>
        </Route>

        {/* Redirección por defecto a reservas para probar directo */}
        <Route path="/" element={<Navigate to="/reservations" replace />} />
        <Route path="*" element={<Navigate to="/reservations" replace />} />
      </Routes>
    </BrowserRouter>
  );
}