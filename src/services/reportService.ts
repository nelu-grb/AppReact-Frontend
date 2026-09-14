import apiClient from './apiClient';

export interface ReportKpis {
  reservationsByHour: Record<string, number>;
  activeOccupancy: number;
  averageCycleTimeMinutes: number;
}

export const getReportKpis = async (): Promise<ReportKpis> => {
  const response = await apiClient.get<ReportKpis>('/reports/kpis');
  return response.data;
};
