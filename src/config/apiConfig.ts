export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL,
  scopes: [import.meta.env.VITE_API_SCOPE],
};

export const API_ENDPOINTS = {
  catalog: {
    list: "/api/units",
    detail: (id: string | number) => `/api/units/${id}`,
  },
  reservations: {
    list: "/reservations",
    create: "/reservations",
    detail: (id: string) => `/reservations/${id}`,
    update: (id: string) => `/reservations/${id}`,
    delete: (id: string) => `/reservations/${id}`,
  },
  audit: {
    list: "/audit",
  },
};