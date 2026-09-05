import apiClient from '../services/apiClient';

export function useApi() {
  return {
    get: <T>(url: string, config = {}) => apiClient.get<T>(url, config).then((res) => res.data),
    post: <T>(url: string, data?: unknown, config = {}) => apiClient.post<T>(url, data, config).then((res) => res.data),
    put: <T>(url: string, data?: unknown, config = {}) => apiClient.put<T>(url, data, config).then((res) => res.data),
    delete: <T>(url: string, config = {}) => apiClient.delete<T>(url, config).then((res) => res.data),
    client: apiClient,
  };
}