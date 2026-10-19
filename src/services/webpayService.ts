import apiClient from './apiClient';

export interface WebpayCheckoutResponse {
  url: string;
  token: string;
}

/**
 * Inicia la transacción en Webpay para una reserva confirmada.
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