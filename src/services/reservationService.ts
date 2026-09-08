import apiClient from './apiClient';

export interface ReservationRequest {
  guestId?: string;
  guestName: string;
  guestEmail: string;
  unitId: number; // Estricto como número para coincidir con el Long/Integer de Java
  startDate: string;
  endDate: string;
  channel: 'Web' | 'Instagram' | 'WhatsApp' | 'Directo';
  totalAmount: number;
}

export type ReservationStatus = 
  | 'CREADA' 
  | 'CONFIRMADA' 
  | 'CHECKIN_PENDIENTE' 
  | 'EN_ESTADÍA' 
  | 'CHECKOUT' 
  | 'CANCELADA';

// Estructura de respuesta devuelta por Spring Boot
export interface ReservationResponse {
  id: number;
  code: string;
  guestId?: string;
  guestName: string;
  guestEmail: string;
  unitId: number;
  unitName?: string;
  startDate: string;
  endDate: string;
  channel: string;
  status: ReservationStatus;
  totalAmount: number;
}

export const getReservations = async (): Promise<ReservationResponse[]> => {
  const res = await apiClient.get<ReservationResponse[]>('/api/reservations');
  return res.data;
};

export const createReservation = async (data: ReservationRequest): Promise<ReservationResponse> => {
  const res = await apiClient.post<ReservationResponse>('/api/reservations', data);
  return res.data;
};

export const updateReservationStatus = async (
  id: string | number, 
  status: ReservationStatus
): Promise<ReservationResponse> => {
  const res = await apiClient.put<ReservationResponse>(`/api/reservations/${id}/status`, { status });
  return res.data;
};