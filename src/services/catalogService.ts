import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

export type UnitType = 'HABITACION' | 'SUITE' | 'APARTAMENTO' | 'CABANA';

export interface Unit {
  unitId: number;
  name: string;
  description: string;
  address: string;
  type: UnitType;
  city: string;
  availability: boolean;
  rooms: number;
  bathrooms: number;
  pricePerNight: number;
  maxOccupancy: number;
}

export interface UnitRequest {
  name: string;
  description: string;
  address: string;
  type: UnitType;
  city: string;
  availability: boolean;
  rooms: number;
  bathrooms: number;
  pricePerNight: number;
  maxOccupancy: number;
}

export const getUnits = async (type?: UnitType, availability?: boolean): Promise<Unit[]> => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (availability !== undefined) params.append('availability', String(availability));

  const queryString = params.toString();
  const url = queryString ? `${API_ENDPOINTS.catalog.list}?${queryString}` : API_ENDPOINTS.catalog.list;
  const res = await apiClient.get<Unit[]>(url);
  return res.data;
};

export const getUnitById = async (unitId: number): Promise<Unit> => {
  const res = await apiClient.get<Unit>(API_ENDPOINTS.catalog.detail(unitId));
  return res.data;
};

export const createUnit = async (data: UnitRequest): Promise<Unit> => {
  const res = await apiClient.post<Unit>(API_ENDPOINTS.catalog.list, data);
  return res.data;
};

export const updateUnit = async (unitId: number, data: UnitRequest): Promise<Unit> => {
  const res = await apiClient.put<Unit>(API_ENDPOINTS.catalog.detail(unitId), data);
  return res.data;
};

export const deleteUnit = async (unitId: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.catalog.detail(unitId));
};
