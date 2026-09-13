export const API_CONFIG = {
  baseURL: "https://hyfvjy63q3.execute-api.us-east-1.amazonaws.com",
  scopes: ["api://3576de9b-8f84-48c4-b112-5a793bc04abc/access_as_user"],
};

export const API_ENDPOINTS = {
  catalog: {
    list: "/api/catalog",
    detail: (id: string) => `/api/catalog/${id}`,
  },
  reservations: {
    list: "/api/reservations",
    create: "/api/reservations",
    detail: (id: string) => `/api/reservations/${id}`,
    update: (id: string) => `/api/reservations/${id}`,
    delete: (id: string) => `/api/reservations/${id}`,
  },
  audit: {
    list: "/api/audit",
  },
};