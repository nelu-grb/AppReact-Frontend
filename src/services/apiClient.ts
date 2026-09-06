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
      if (accounts.length > 0) {
        account = accounts[0];
        msalInstance.setActiveAccount(account);
      }
    }

    if (account) {
      try {
        // Intenta adquirir el Access Token en silencio
        const response = await msalInstance.acquireTokenSilent({
          scopes: API_CONFIG.scopes,
          account,
        });

        // Inyecta el Bearer Token en la cabecera
        config.headers.set('Authorization', `Bearer ${response.accessToken}`);
        console.log(`[API Client] Token inyectado para ${account.username}: ${response.accessToken.substring(0, 10)}...`);
      } catch (error) {
        // Si el token expiró y no se puede renovar en silencio, requiere interacción
        if (error instanceof InteractionRequiredAuthError) {
          await msalInstance.acquireTokenRedirect({
            scopes: API_CONFIG.scopes,
          });
        } else {
          console.error('Error al adquirir token con MSAL:', error);
        }
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

    if (status === 401) {
      console.warn('Sesión expirada o token no autorizado (401). Redirigiendo a login...');
      // Limpia sesión activa y redirige
      await msalInstance.logoutRedirect({
        postLogoutRedirectUri: '/login',
      });
    }

    if (status === 403) {
      console.error('Acceso denegado (403): Permisos insuficientes para este recurso.');
      // Opcional: Redirigir al dashboard si intenta acceder a un endpoint fuera de su rol
      window.location.href = '/dashboard';
    }

    return Promise.reject(error);
  }
);

export default apiClient;