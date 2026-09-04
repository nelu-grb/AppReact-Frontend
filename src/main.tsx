import React from 'react';
import ReactDOM from 'react-dom/client';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig';
import App from './App';
import './index.css';

const msalInstance = new PublicClientApplication(msalConfig);

// IMPORTANTE: Esto procesa la respuesta de Azure cuando redirige de vuelta a la app
await msalInstance.initialize();

// Maneja la redirección pendiente si viene de Azure AD
msalInstance.handleRedirectPromise().catch((error) => {
    console.error("Error al manejar la promesa de redirección de MSAL:", error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>
);