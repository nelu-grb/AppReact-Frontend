import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication, EventType, type AccountInfo } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import App from './App';    
import './index.css';
import { msalConfig } from './config/authConfig';

// Importamos el proveedor de contexto que procesa los roles y el perfil del usuario
import { AuthProvider } from './context/AuthContext'; 

// Instanciamos el cliente público de MSAL con la configuración de Azure AD
export const msalInstance = new PublicClientApplication(msalConfig);

// Inicializamos MSAL de forma asíncrona antes de renderizar React
msalInstance.initialize().then(async () => {
  
  // 1. Registrar un escuchador de eventos para capturar el inicio de sesión exitoso
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as { account?: AccountInfo };
      if (payload.account) {
        msalInstance.setActiveAccount(payload.account);
      }
    }
  });

  // 2. Procesar la respuesta de la redirección al regresar desde el portal de Microsoft
  try {
    const response = await msalInstance.handleRedirectPromise();
    if (response?.account) {
      msalInstance.setActiveAccount(response.account);
    } else if (!msalInstance.getActiveAccount()) {
      // Si no hay cuenta activa explícita pero existe solo una en sesión, la establecemos
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 1) {
        msalInstance.setActiveAccount(accounts[0]);
      }
    }
  } catch (err) {
    console.error('Error al procesar la redirección de MSAL:', err);
  }

  // 3. Renderizar la aplicación React con la jerarquía de proveedores
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MsalProvider>
    </React.StrictMode>
  );
}).catch((error) => {
  console.error('Error al inicializar la instancia de MSAL:', error);
});