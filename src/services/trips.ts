// src/services/trips.ts

import { api } from './backendApi';
import type { Trip, CreateTripDto, UpdateTripDto } from './types';

export const tripsService = {
  /** GET /trips */
  getAll(): Promise<Trip[]> {
    return api.get<Trip[]>('/trips');
  },

  /** GET /trips/:id */
  getById(id: string): Promise<Trip> {
    return api.get<Trip>(`/trips/${id}`);
  },

  /** GET /trips/client/:clientId */
  getByClient(clientId: string): Promise<Trip[]> {
    return api.get<Trip[]>(`/trips/client/${clientId}`);
  },

  /** GET /trips/client/:clientId/range?from=&to= */
  getByDateRange(clientId: string, from: string, to: string): Promise<Trip[]> {
    const params = new URLSearchParams({ from, to });
    return api.get<Trip[]>(`/trips/client/${clientId}/range?${params}`);
  },

  /** POST /trips */
  create(body: CreateTripDto): Promise<Trip> {
    return api.post<Trip>('/trips', body);
  },

  /** PATCH /trips/:id */
  update(id: string, body: UpdateTripDto): Promise<Trip> {
    return api.patch<Trip>(`/trips/${id}`, body);
  },

  /** DELETE /trips/:id */
  remove(id: string): Promise<void> {
    return api.delete<void>(`/trips/${id}`);
  },
};
