import type { Configuration } from "@azure/msal-browser";

// Si existe la variable en el .env la usa; si no, toma la URL actual del navegador por defecto
const redirectUri =
  import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;

export const msalConfig: Configuration = {
  auth: {
    clientId: String(import.meta.env.VITE_AZURE_CLIENT_ID).trim(),
    authority: "https://domnerus1.ciamlogin.com/934f23a0-098f-4b94-81be-bc5360fd4eb4/v2.0",
    redirectUri,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const loginRequest = {
  scopes: ['api://ed8a85ef-f2d4-48c5-a17e-b69abfc4694e/access_as_user'],  
  prompt: 'login',
};