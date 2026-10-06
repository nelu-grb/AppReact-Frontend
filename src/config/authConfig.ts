import type { Configuration, RedirectRequest } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const subdomain = "andesstay";
const authority = `https://${subdomain}.ciamlogin.com/${tenantId}/v2.0/`;
const redirectUri = window.location.origin;

const scopes = [
  "api://3576de9b-8f84-48c4-b112-5a793bc04abc/access_as_user",
];

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority,                                                                          
    redirectUri,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: {
    cacheLocation: "localStorage",
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

// Configuración de login que fuerza el selector de cuentas
export const loginRequest: RedirectRequest = {
  scopes,
  prompt: "select_account", // iniciar sesion, da la opcion de cuentas ya logueadas
};

export const silentRequest: RedirectRequest = {
  scopes,
};

export const tokenRequest: RedirectRequest = {
  scopes,
};