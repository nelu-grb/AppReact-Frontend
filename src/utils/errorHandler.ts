import { AxiosError } from 'axios';

export const parseApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return 'No hay conexión con el servidor backend. Verifica que ms-bff esté activo.';
    }
    switch (error.response.status) {
      case 401:
        return 'Sesión expirada o no autorizada. Por favor reingresa con tu cuenta de Entra ID.';
      case 403:
        return 'No tienes los permisos o el rol adecuado para consultar esta información.';
      case 404:
        return 'El recurso solicitado no fue encontrado en la base de datos.';
      case 500:
        return 'Error interno en el servidor backend (Spring Boot).';
      default:
        return error.response.data?.message || 'Error desconocido al procesar la petición.';
    }
  }
  return 'Ocurrió un error inesperado en la aplicación.';
};