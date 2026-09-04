import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Catalog from './pages/Catalog';
import ProtectedData from './ProtectedData'; 

export default function App() {
  const { instance } = useMsal();

  useEffect(() => {
    instance.handleRedirectPromise().catch((error) => {
      console.error("Error al procesar redirect:", error);
    });
  }, [instance]);

  return (
    <div className="app-container">
      <AuthenticatedTemplate>
        <Navbar />
        <main className="main-wrapper">
          <ProtectedData />
        </main>
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <LoginScreen />
      </UnauthenticatedTemplate>
    </div>
  );
}