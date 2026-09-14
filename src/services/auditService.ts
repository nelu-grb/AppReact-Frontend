import apiClient from './apiClient';

export interface AuditEvent {
  id: number;
  eventType: string;
  aggregateId: string;
  actor: string;
  payload: string;
  timestamp: string;
}

export const getAuditEvents = async (): Promise<AuditEvent[]> => {
  const response = await apiClient.get<AuditEvent[]>('/audit');
  return response.data;
};
