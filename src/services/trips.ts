import { api } from './backendApi';
import type { Trip, CreateTripDto, UpdateTripDto } from './types';

export const tripsService = {
  getAll(): Promise<Trip[]> {
    return api.get<Trip[]>('/trips');
  },

  getById(id: string): Promise<Trip> {
    return api.get<Trip>(`/trips/${id}`);
  },

  getByClient(clientId: string): Promise<Trip[]> {
    return api.get<Trip[]>(`/trips/client/${clientId}`);
  },

  getByDateRange(clientId: string, from: string, to: string): Promise<Trip[]> {
    const params = new URLSearchParams({ from, to });
    return api.get<Trip[]>(`/trips/client/${clientId}/range?${params}`);
  },

  create(body: CreateTripDto): Promise<Trip> {
    return api.post<Trip>('/trips', body);
  },

  update(id: string, body: UpdateTripDto): Promise<Trip> {
    return api.patch<Trip>(`/trips/${id}`, body);
  },

  remove(id: string): Promise<void> {
    return api.delete<void>(`/trips/${id}`);
  },
};
