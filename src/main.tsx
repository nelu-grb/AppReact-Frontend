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
  // 1. Escuchar eventos de inicio de sesión
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as { account?: AccountInfo };
      if (payload.account) {
        msalInstance.setActiveAccount(payload.account);
      }
    }
  });

  // 2. Procesar el resultado de la redirección solo cuando vuelve de Microsoft
  try {
    const response = await msalInstance.handleRedirectPromise();
    if (response?.account) {
      msalInstance.setActiveAccount(response.account);
    }
  } catch (err) {
    console.error('Error procesando redirección de MSAL:', err);
  }

  // 3. Montar la aplicación (ya no forzamos accounts[0] automáticamente)
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