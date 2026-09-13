import type { Configuration } from "@azure/msal-browser";

// Si existe la variable en el .env la usa; si no, toma la URL actual del navegador por defecto
const redirectUri =
  import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;

export const msalConfig: Configuration = {
  auth: {
    clientId: String(import.meta.env.VITE_AZURE_CLIENT_ID).trim(),
    authority:
      import.meta.env.VITE_AZURE_AUTHORITY ||
      'https://login.microsoftonline.com/common',
    redirectUri,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const loginRequest = {
  scopes: ['User.Read'],
  prompt: 'login',
};