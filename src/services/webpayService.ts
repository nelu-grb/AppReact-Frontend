import apiClient from './apiClient';

export interface WebpayCheckoutResponse {
  url: string;
  token: string;
}

export type WebpayPaymentStatus = 'APPROVED' | 'REJECTED' | 'ABORTED' | 'PENDING';

export interface WebpayPaymentResult {
  status: WebpayPaymentStatus;
  reservationId: number;
  amount?: number;
  authorizationCode?: string;
}

/**
 * 1. Inicia la transacción en Webpay recibiendo el ID de la reserva creada.
 * Endpoint Backend: POST /reservations/{id}/pay
 */
export const initiateWebpayCheckout = async (
  reservationId: number | string,
): Promise<WebpayCheckoutResponse> => {
  const response = await apiClient.post<WebpayCheckoutResponse>(
    `/reservations/${reservationId}/pay`
  );

  return response.data;
};

/**
 * 2. Confirma la transacción con Transbank al regresar a la pantalla de resultados.
 * Endpoint Backend: POST /reservations/confirm-payment?token_ws=...
 */
export const confirmWebpayPayment = async (
  tokenWs: string,
): Promise<WebpayPaymentResult> => {
  const response = await apiClient.post<WebpayPaymentResult>(
    '/reservations/confirm-payment',
    null,
    {
      params: { token_ws: tokenWs },
    }
  );

  return response.data;
};