import apiClient from './apiClient';

export interface ReservationRequest {
  guestId?: string;
  guestName: string;
  unitId: number | string;
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

export const getReservations = async () => {
  const res = await apiClient.get('/api/reservations');
  return res.data;
};

export const createReservation = async (data: ReservationRequest) => {
  const res = await apiClient.post('/api/reservations', data);
  return res.data;
};

export const updateReservationStatus = async (id: string, status: ReservationStatus) => {
  const res = await apiClient.put(`/api/reservations/${id}/status`, { status });
  return res.data;
};