export const API_CONFIG = {
  baseURL: "https://hyfvjy63q3.execute-api.us-east-1.amazonaws.com",
  scopes: ["api://3576de9b-8f84-48c4-b112-5a793bc04abc/access_as_user"],
};

export const API_ENDPOINTS = {
  catalog: {
    list: "/catalog",
    detail: (id: string) => `/catalog/${id}`,
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