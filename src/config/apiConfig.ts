const baseURL = import.meta.env.VITE_API_BASE_URL?.trim();

if (!baseURL) {
  throw new Error('Falta configurar VITE_API_BASE_URL');
}

const apiScope = import.meta.env.VITE_API_SCOPE?.trim();

if (!apiScope) {
  throw new Error('Falta configurar VITE_API_SCOPE');
}

export const API_CONFIG = {
  baseURL: baseURL.replace(/\/+$/, ''), // Elimina cualquier barra inclinada al final
  scopes: [apiScope],
};