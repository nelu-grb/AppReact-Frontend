import type { Configuration, RedirectRequest } from "@azure/msal-browser";

// 1. Lectura de variables de entorno de Azure AD / Entra ID
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const subdomain = "andesstay";

// Authority configurado para Microsoft Entra External ID (CIAM)
const authority = `https://${subdomain}.ciamlogin.com/${tenantId}/v2.0/`;
const redirectUri = window.location.origin;

// Permisos (scopes) personalizados para consumir tu backend protegido
const scopes = [
  "api://3576de9b-8f84-48c4-b112-5a793bc04abc/access_as_user",
];

// 2. Configuración principal de MSAL Browser
export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority,
    redirectUri,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: {
    cacheLocation: "localStorage", // Mantiene la sesión guardada tras cerrar la pestaña
  },
  system: {
    loggerOptions: {
      loggerCallback: (logLevel, message) => {
        console.log(`[MSAL] ${logLevel}: ${message}`);
      },
      piiLoggingEnabled: false,
    },
  },
};

// 3. Solicitud de login interactiva
export const loginRequest: RedirectRequest = {
  scopes,
  prompt: "login", // OMITIR el selector de cuentas y exigir credenciales directas
};

// Solicitud para renovación silenciosa de tokens
export const silentRequest: RedirectRequest = {
  scopes,
};

// Solicitud para la obtención explícita de tokens de acceso
export const tokenRequest: RedirectRequest = {
  scopes,
};