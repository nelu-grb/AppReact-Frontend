/**
 * API Configuration
 * 
 * This config is used by the API client to:
 * 1. Know where to send requests (baseURL)
 * 2. What scopes to request for the token
 * 
 * The token obtained with these scopes will be sent in the Authorization header
 * to the Backend API, which validates it through Spring Security OAuth2 Resource Server
 */

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim();
const apiScope = import.meta.env.VITE_API_SCOPE?.trim();

if (!baseURL) {
  console.warn("⚠️  VITE_API_BASE_URL not configured. Using placeholder.");
}

if (!apiScope) {
  console.warn("⚠️  VITE_API_SCOPE not configured. Using placeholder.");
}

export const API_CONFIG = {
  baseURL: baseURL?.replace(/\/+$/, "") || "http://localhost:8080", // Removes trailing slashes
  scopes: apiScope ? [apiScope] : ["PLACEHOLDER_API_SCOPE"], // e.g., api://myapi/read
};

/**
 * API Endpoints
 * Define your backend endpoints here for type safety and easy management
 */
export const API_ENDPOINTS = {
  // Catalog endpoints
  catalog: {
    list: "/api/catalog",
    detail: (id: string) => `/api/catalog/${id}`,
  },
  // Reservations endpoints
  reservations: {
    list: "/api/reservations",
    create: "/api/reservations",
    detail: (id: string) => `/api/reservations/${id}`,
    update: (id: string) => `/api/reservations/${id}`,
    delete: (id: string) => `/api/reservations/${id}`,
  },
  // Audit endpoints
  audit: {
    list: "/api/audit",
  },
};