export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  scopes: [
    import.meta.env.VITE_API_SCOPE || 'api://ed8a85ef-f2d4-48c5-a17e-b69abfc4694e/OT.create',
  ],
};