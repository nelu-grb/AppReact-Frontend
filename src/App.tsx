import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated } from '@azure/msal-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Catalog from './pages/Catalog';
import Audit from './pages/Audit';
import { ProtectedData } from './ProtectedData'; 
import type { JSX } from 'react/jsx-runtime';

// Componente para proteger rutas privadas
function PrivateRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = useIsAuthenticated();
  // Si no ha iniciado sesión, lo manda al login; si ya inició, muestra la página
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <BrowserRouter>
      <Routes>
        {/* Si ya inició sesión y entra a la raíz o al login, lo mandamos directo al Dashboard */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />

        {/* Rutas Protegidas que exigen estar logueado */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/reservations" element={<PrivateRoute><Reservations /></PrivateRoute>} />
        <Route path="/catalog" element={<PrivateRoute><Catalog /></PrivateRoute>} />
        <Route path="/auditoria" element={<PrivateRoute><Audit /></PrivateRoute>} />
        
        <Route path="/test-api" element={<PrivateRoute><ProtectedData /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}