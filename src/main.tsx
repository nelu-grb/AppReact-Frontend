import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication, EventType, type Configuration } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import App from './App';    
import './index.css';

//pruebaaa


const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID ?? '',
    authority: import.meta.env.VITE_AZURE_AUTHORITY ?? 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Inicializar MSAL antes de renderizar la aplicación
msalInstance.initialize().then(() => {
  // Manejo de la cuenta activa tras el inicio de sesión
  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as { account?: any };
      if (payload.account) {
        msalInstance.setActiveAccount(payload.account);
      }
    }
  });

  // Manejar el resultado de redirección si viene de un flujo redirect
  msalInstance.handleRedirectPromise().catch((err) => {
    console.error('Error procesando redirección de MSAL:', err);
  });

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