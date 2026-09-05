import apiClient from './apiClient';

export interface ReservationRequest {
  unitId: number;
  guestId: string;
  guestEmail: string;
  startDate: string; // formato YYYY-MM-DD
  endDate: string;   // formato YYYY-MM-DD
  totalAmount: number;
}

export interface ReservationResponse extends ReservationRequest {
  code: string;
  id?: number | string;
  status?: string;
  createdAt?: string;
}

export const getReservations = async (): Promise<ReservationResponse[]> => {
  const response = await apiClient.get('/api/reservations');
  return response.data;
};

export const createReservation = async (data: ReservationRequest): Promise<ReservationResponse> => {
  const response = await apiClient.post('/api/reservations', data);
  return response.data;
};