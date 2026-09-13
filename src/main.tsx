import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication, EventType, type AccountInfo } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import App from './App';    
import './index.css';

import { msalConfig } from './config/authConfig';

export const msalInstance = new PublicClientApplication(msalConfig);

// Inicializar MSAL y procesar la redirección antes de renderizar
msalInstance.initialize().then(async () => {
  // 1. Escuchar eventos futuros de inicio de sesión
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as { account?: AccountInfo };
      if (payload.account) {
        msalInstance.setActiveAccount(payload.account);
      }
    }
  });

  // 2. Procesar el resultado de la redirección al volver de Microsoft
  try {
    const response = await msalInstance.handleRedirectPromise();
    if (response?.account) {
      msalInstance.setActiveAccount(response.account);
    }
  } catch (err) {
    console.error('Error procesando redirección de MSAL:', err);
  }

  // 3. Mantener la sesión activa si el usuario recarga la página
  if (!msalInstance.getActiveAccount()) {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  }

  // 4. Montar la aplicación una vez asegurado el estado
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
}).catch((error) => {
  console.error('Error inicializando MSAL:', error);
});