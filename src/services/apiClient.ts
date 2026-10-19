import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { msalInstance } from '../main';
import { API_CONFIG } from '../config/apiConfig';

const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Peticiones: Inyección del Bearer Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let account = msalInstance.getActiveAccount();

    if (!account) {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 1) {
        account = accounts[0];
        msalInstance.setActiveAccount(account);
      } else if (accounts.length > 1) {
        return Promise.reject(
          new Error('No se puede determinar la cuenta activa porque hay varias cuentas de Microsoft.')
        );
      }
    }

    if (account) {
      try {
        const response = await msalInstance.acquireTokenSilent({
          scopes: API_CONFIG.scopes,
          account,
        });

        config.headers.set('Authorization', `Bearer ${response.accessToken}`);
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          await msalInstance.acquireTokenRedirect({
            scopes: API_CONFIG.scopes,
          });
          return Promise.reject(new Error('Se requiere interacción para adquirir el token. Redirigiendo a login...'));
        }
        
        return Promise.reject(error);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuestas: Manejo Global de 401 y 403
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    // 401 (sesión expirada): solo propagamos el error.
    // No forzamos logout/redirección aquí para no interrumpir al usuario.

    // 403 (sin permisos): NO redirigir ni recargar la página.
    // Antes se hacía `window.location.href = '/dashboard'`, lo que provocaba un
    // bucle infinito de recarga: el propio Dashboard volvía a pedir endpoints
    // que respondían 403 y se recargaba otra vez sin fin.
    if (status === 403) {
      console.warn('Acceso denegado (403) en', error.config?.url);
    }

    return Promise.reject(error);
  }
);

export default apiClient;