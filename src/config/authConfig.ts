import type { Configuration, AuthenticationFlowRequest } from "@azure/msal-browser";

/**
 * MSAL Configuration for Azure Entra ID (Microsoft Entra)
 * 
 * Before using this config, ensure you have:
 * 1. Frontend app registered in Azure Entra ID
 * 2. Backend API registered with exposed scopes (e.g., api://myapi/read, api://myapi/write)
 * 3. API permissions added to Frontend app
 * 4. User Flow created in External Identities
 */

// Get values from environment variables
const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const redirectUri = import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin;

// Validate required configuration
if (!clientId || !tenantId) {
  console.warn(
    "⚠️  MSAL Configuration incomplete. Please set VITE_AZURE_CLIENT_ID and VITE_AZURE_TENANT_ID in .env"
  );
}

/**
 * Authority URL format for Entra External ID:
 * https://<tenant-subdomain>.ciamlogin.com/<tenantID>/v2.0/
 */
const authority = `https://${import.meta.env.VITE_AZURE_SUBDOMAIN || "PLACEHOLDER"}.ciamlogin.com/${tenantId}/v2.0/`;

/**
 * MSAL Browser Configuration
 * Docs: https://learn.microsoft.com/azure/active-directory/develop/msal-js-initializing-client-applications
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || "PLACEHOLDER_CLIENT_ID",
    authority: authority,
    redirectUri: redirectUri,
    postLogoutRedirectUri: `${window.location.origin}/login`,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage", // Options: 'sessionStorage' or 'localStorage'
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (logLevel, message) => {
        if (import.meta.env.DEV) {
          console.log(`[MSAL] ${logLevel}: ${message}`);
        }
      },
      piiLoggingEnabled: false,
    },
  },
};

/**
 * Login Request Configuration
 * These scopes will be requested when user logs in
 * 
 * Why scopes?
 * - MSAL requests an Access Token with these scopes
 * - The token will include the scopes in its payload
 * - API Gateway verifies the token has required scopes
 * - Backend can also validate additional scopes
 * 
 * Format: api://<backend-app-id>/<scope-name>
 * Example: api://myapi/read, api://myapi/write
 */
export const loginRequest: AuthenticationFlowRequest = {
  scopes: import.meta.env.VITE_AZURE_SCOPES?.split(",").map((s: string) => s.trim()) || [
    "PLACEHOLDER_SCOPE_1", // Replace with api://myapi/read
    "PLACEHOLDER_SCOPE_2", // Replace with api://myapi/write
  ],
  prompt: "login",
};

/**
 * Silent Token Request
 * Used for acquiring tokens without user interaction
 */
export const silentRequest: AuthenticationFlowRequest = {
  scopes: loginRequest.scopes,
};

/**
 * Token Configuration for API calls
 * The token acquired with these scopes can be sent to the backend API
 */
export const tokenRequest: AuthenticationFlowRequest = {
  scopes: loginRequest.scopes,
  forceRefresh: false,
};