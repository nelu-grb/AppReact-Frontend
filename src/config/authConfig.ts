import type { Configuration } from "@azure/msal-browser";

// Configuración de MSAL para la autenticación con Azure AD B2C / CIAM
const redirectUri =
  import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;
const accessScope =
  import.meta.env.VITE_AZURE_SCOPE ||
  `${import.meta.env.VITE_AZURE_CLIENT_ID}/access_as_user`;

export const msalConfig: Configuration = {
  auth: {
    clientId: String(import.meta.env.VITE_AZURE_CLIENT_ID).trim(),
    authority:
      import.meta.env.VITE_AZURE_AUTHORITY,
    redirectUri,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

// Configuración de la solicitud de inicio de sesión
export const loginRequest = {
  scopes: [accessScope], // Usa la variable dinámica o mantén tu scope fijo
  prompt: 'select_account', // <--- CAMBIO AQUÍ: Obliga a Microsoft a mostrar el selector de cuentas
};