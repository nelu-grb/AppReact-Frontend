# MSAL Configuration Setup Guide

Your MSAL configuration has been updated from scratch with placeholders. Follow these steps to complete the setup:

## Step 1: Create Azure Entra ID Applications

### 1.1 Register Backend API Application
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Entra ID** → **App registrations** → **New registration**
3. Enter Name: `MyBackendAPI` (or your preferred name)
4. Click **Register**
5. Copy and save:
   - **Application (client) ID** → You'll use this as the Backend App ID
   - **Directory (tenant) ID** → Save for later

### 1.2 Register Frontend Application
1. In **App registrations**, create another new registration
2. Enter Name: `MyFrontendApp` (or your preferred name)
3. Under **Redirect URI**, select **Single-page application (SPA)**
4. Enter your redirect URIs:
   - Local: `http://localhost:5173`
   - Production: `https://yourdomain.com`
5. Click **Register**
6. Copy and save:
   - **Application (client) ID** → Use for `VITE_AZURE_CLIENT_ID`
   - **Directory (tenant) ID** → Use for `VITE_AZURE_TENANT_ID`

---

## Step 2: Expose Backend API & Create Scopes

### For your Backend API App Registration:

1. Go to **Expose an API**
2. Click **Set** next to Application ID URI
3. Enter: `api://myapi` (or your preferred identifier)
4. Click **Save**
5. Click **Add a scope**
6. Create two scopes:
   - **Scope name**: `read` → Description: "Read access to API"
   - **Scope name**: `write` → Description: "Write access to API"
7. Save both scopes

You'll now have scopes like:
- `api://myapi/read`
- `api://myapi/write`

---

## Step 3: Add API Permissions to Frontend App

### In your Frontend App Registration:

1. Go to **API permissions** → **Add a permission**
2. Search for your Backend API by name
3. Select the scopes: `read` and `write`
4. Click **Add permissions**
5. Click **Grant admin consent for [your tenant]** (Important to avoid consent dialogs)

---

## Step 4: Create User Flow (External Identities)

This is where users register and authenticate:

1. Go to **Azure Entra ID** → **External Identities** → **User flows**
2. Click **New user flow**
3. Configuration:
   - **Name**: `FlujoDuoc1` (or your preferred name)
   - **Identity providers**: Select "Email with password"
   - **User attributes**: Select desired fields (Given Name, Surname, City, etc.)
4. Click **Create**

After creation, you'll see:
- **User flow name** (e.g., `B2C_1_FlujoDuoc1`)
- This defines the **Issuer URL**: `https://<tenant>.ciamlogin.com/<tenantID>/v2.0/`

---

## Step 5: Get Azure Subdomain

1. Go to **Azure Entra ID** → **External Identities** → **User flows**
2. Open your user flow
3. Look at the **Overview** or **Run user flow** button
4. The authorization endpoint will show: `https://<SUBDOMAIN>.ciamlogin.com/...`
5. Extract the subdomain (e.g., if it's `https://mycompany.ciamlogin.com/...`, use `mycompany`)

---

## Step 6: Fill in Your `.env` File

Create `.env` in your frontend root directory with these values:

```bash
# ============ MSAL ============
VITE_AZURE_CLIENT_ID=<your-frontend-app-client-id>
VITE_AZURE_TENANT_ID=<your-tenant-id>
VITE_AZURE_SUBDOMAIN=<your-subdomain>
VITE_AZURE_REDIRECT_URI=http://localhost:5173
VITE_AZURE_SCOPES=api://myapi/read,api://myapi/write

# ============ API ============
VITE_API_BASE_URL=http://localhost:8080
VITE_API_SCOPE=api://myapi/read

# ============ ENVIRONMENT ============
VITE_ENVIRONMENT=development
```

### Where to find each value:

| Environment Variable | Where to Find |
|---|---|
| `VITE_AZURE_CLIENT_ID` | Azure Portal → App registrations → Frontend App → Overview → Application (client) ID |
| `VITE_AZURE_TENANT_ID` | Azure Portal → App registrations → Frontend App → Overview → Directory (tenant) ID |
| `VITE_AZURE_SUBDOMAIN` | From your User Flow issuer URL (e.g., `https://subdomain.ciamlogin.com/...`) |
| `VITE_AZURE_REDIRECT_URI` | Your frontend URL (local: `http://localhost:5173`) |
| `VITE_AZURE_SCOPES` | Backend API App → Expose an API → Scopes (e.g., `api://myapi/read,api://myapi/write`) |
| `VITE_API_BASE_URL` | Your backend URL (local: `http://localhost:8080`) |
| `VITE_API_SCOPE` | One of your VITE_AZURE_SCOPES |

---

## Step 7: Update Your React Components

Your MSAL configuration is ready in:
- **[src/config/authConfig.ts](src/config/authConfig.ts)** - MSAL configuration
- **[src/config/apiConfig.ts](src/config/apiConfig.ts)** - API configuration

### Example: Using in a React Component

```typescript
import { useMsalAuthentication } from "@azure/msal-react";
import { tokenRequest } from "@/config/authConfig";

function MyComponent() {
  const { result, error, login } = useMsalAuthentication("popup");

  return (
    <div>
      {!result && <button onClick={login}>Login</button>}
      {error && <p>Error: {error.message}</p>}
      {result && <p>Welcome!</p>}
    </div>
  );
}
```

### Example: Getting Access Token for API Calls

```typescript
import { useMsal } from "@azure/msal-react";
import { tokenRequest } from "@/config/authConfig";

function ApiCallerComponent() {
  const { instance, accounts } = useMsal();

  const callApi = async () => {
    try {
      const token = await instance.acquireTokenSilent({
        ...tokenRequest,
        account: accounts[0],
      });
      
      // Use token in API request
      const response = await fetch("http://localhost:8080/api/data", {
        headers: {
          "Authorization": `Bearer ${token.accessToken}`,
        },
      });
      
      return response.json();
    } catch (error) {
      console.error("Token acquisition failed:", error);
    }
  };

  return <button onClick={callApi}>Get Data</button>;
}
```

---

## Step 8: Configure Backend API Gateway (AWS)

Following the guide, configure AWS API Gateway with JWT Authorizer:

1. Create REST API in AWS Console
2. Add resources and methods
3. Configure JWT Authorizer:
   - **Issuer**: `https://<tenant>.ciamlogin.com/<tenantID>/v2.0/`
   - **Audience**: Your Backend API Application ID
   - **Token Source**: `Authorization` header

---

## Step 9: Configure Backend Spring Boot (Java)

Your Spring Boot backend should validate tokens using Spring Security OAuth2:

```yaml
# application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://<tenant>.ciamlogin.com/<tenantID>/v2.0/
          jwk-set-uri: https://<tenant>.ciamlogin.com/<tenantID>/discovery/v2.0/keys
```

---

## Troubleshooting

### Issue: "Scopes not found"
- **Solution**: Verify in Backend App Registration → Expose an API that scopes are created

### Issue: "Redirect URI mismatch"
- **Solution**: Ensure `VITE_AZURE_REDIRECT_URI` matches exactly what's in Azure App Registration

### Issue: "Access token not valid for resource"
- **Solution**: Verify `VITE_AZURE_SCOPES` matches the scopes in your Backend API

### Issue: "CORS error calling backend"
- **Solution**: Configure CORS on your Spring Boot backend or API Gateway

---

## Quick Reference: File Changes

1. ✅ **[src/config/authConfig.ts](src/config/authConfig.ts)** - Complete MSAL configuration with:
   - `msalConfig` - Main configuration
   - `loginRequest` - Login scopes
   - `silentRequest` - Silent token request
   - `tokenRequest` - API call token request

2. ✅ **[src/config/apiConfig.ts](src/config/apiConfig.ts)** - Updated with:
   - `API_CONFIG` - Base URL and scopes
   - `API_ENDPOINTS` - Predefined API routes

3. ✅ **[.env.example](.env.example)** - Template with all required variables

---

## Next Steps

1. **Complete Azure Setup** - Follow Steps 1-5 above
2. **Create `.env` file** - Copy `.env.example` to `.env` and fill in your values
3. **Test Login** - Try logging in with your configured MSAL setup
4. **Integrate API Calls** - Use the token in your API requests
5. **Configure Backend** - Set up Spring Boot OAuth2 validation
6. **Deploy to API Gateway** - Configure AWS API Gateway JWT Authorizer

---

## Reference Links

- [Register an app (Azure Docs)](https://learn.microsoft.com/azure/active-directory/develop/quickstart-register-app)
- [Expose Web APIs](https://learn.microsoft.com/azure/active-directory/develop/quickstart-configure-app-expose-web-apis)
- [Add API Permissions](https://learn.microsoft.com/azure/active-directory/develop/quickstart-configure-app-access-web-apis)
- [User Flows in External ID](https://learn.microsoft.com/azure/active-directory-b2c/tutorial-create-user-flows)
- [MSAL for JavaScript](https://learn.microsoft.com/azure/active-directory/develop/msal-overview)
- [JWT Authorizer in API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)

