import type { Configuration, AuthenticationFlowRequest } from "@azure/msal-browser";

// Hardcoded MSAL Configuration
const clientId = "7bb0c8b5-758b-4ad5-baf1-c5077bd72d2b";
const tenantId = "a1c2bfc6-a6aa-4f55-8d5d-0f493a955062";
const subdomain = "andesstay";
const authority = `https://${subdomain}.ciamlogin.com/${tenantId}/v2.0/`;
const redirectUri = window.location.origin;

// Scopes for API calls
const scopes = [
  "api://3576de9b-8f84-48c4-b112-5a793bc04abc/access_as_user",
];

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority,
    redirectUri,
    postLogoutRedirectUri: `${window.location.origin}/login`,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
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

export const loginRequest: AuthenticationFlowRequest = {
  scopes,
};

export const silentRequest: AuthenticationFlowRequest = {
  scopes,
};

export const tokenRequest: AuthenticationFlowRequest = {
  scopes,
  forceRefresh: false,
};