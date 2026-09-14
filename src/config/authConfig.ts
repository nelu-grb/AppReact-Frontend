import type { Configuration } from "@azure/msal-browser";

// Configuración de MSAL para la autenticación con Azure AD B2C
const redirectUri =
  import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;
const accessScope =
  import.meta.env.VITE_AZURE_SCOPE ||
  `${import.meta.env.VITE_AZURE_CLIENT_ID}/access_as_user`;

export const msalConfig: Configuration = {
  auth: {
    clientId: String(import.meta.env.VITE_AZURE_CLIENT_ID).trim(),
    authority:
    "https://domnerus1.ciamlogin.com/934f23a0-098f-4b94-81be-bc5360fd4eb4/v2.0",
    redirectUri,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

// Configuración de la solicitud de inicio de sesión
export const loginRequest = {
  scopes: ['api://ed8a85ef-f2d4-48c5-a17e-b69abfc4694e/access_as_user'],
  prompt: 'login',
};