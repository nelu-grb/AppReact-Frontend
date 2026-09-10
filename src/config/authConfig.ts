import { type Configuration, LogLevel } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || 'ed8a85ef-f2d4-48c5-a17e-b69abfc4694e';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;

export const msalConfig: Configuration = {
  auth: {
    clientId: String(clientId).trim(),
    authority: `https://login.microsoftonline.com/${String(tenantId).trim()}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: `${window.location.origin}/login`,
  },
  cache: {
    cacheLocation: 'sessionStorage',  
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error(message);
      },
      logLevel: LogLevel.Error,
    },
  },
};

export const loginRequest = {
  scopes: ['User.Read'],
  promt: 'login',
};