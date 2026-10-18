import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

/**
 * KPIs agregados por ms-report a partir de los eventos de Kafka
 * (topic `reservations.events`).
 */
export interface ReportKpis {
  /** Mapa hora ISO -> cantidad de reservas creadas en esa hora. */
  reservationsByHour: Record<string, number>;
  /** Reservas cuyo último estado conocido es EN_ESTADIA. */
  activeOccupancy: number;
  /** Promedio (minutos) entre creación y confirmación de reservas. */
  averageCycleTimeMinutes: number;
}

/** Fila cruda almacenada por ms-report (un evento de Kafka). */
export interface ReportRow {
  id: number;
  eventType: string;
  description: string;
  createdAt: string;
}

/** Payload de un evento de reserva publicado en Kafka. */
export interface ReservationReportEvent {
  eventType?: string;
  reservationId?: number | string;
  unitId?: number | string;
  guestId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  actor?: string;
  timestamp?: number;
}

export const fetchReportKpis = async (): Promise<ReportKpis> => {
  const response = await apiClient.get<ReportKpis>(API_ENDPOINTS.reports.kpis);
  return response.data;
};

export const fetchReportRows = async (): Promise<ReportRow[]> => {
  const response = await apiClient.get<ReportRow[]>(API_ENDPOINTS.reports.list);
  return Array.isArray(response.data) ? response.data : [];
};

export const parseReportEvent = (row: ReportRow): ReservationReportEvent | null => {
  try {
    const parsed = JSON.parse(row.description);
    return parsed !== null && typeof parsed === 'object' ? (parsed as ReservationReportEvent) : null;
  } catch {
    return null;
  }
};
