// src/services/trips.ts

import { api } from './backendApi';
import type { Trip, CreateTripDto, UpdateTripDto } from './types';

const withAuth = (accessToken?: string) => (accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined);

export const tripsService = {
  /** GET /trips */
  getAll(accessToken?: string): Promise<Trip[]> {
    return api.get<Trip[]>('/trips', withAuth(accessToken));
  },

  /** GET /trips/:id */
  getById(id: string, accessToken?: string): Promise<Trip> {
    return api.get<Trip>(`/trips/${id}`, withAuth(accessToken));
  },

  /** GET /trips/client/:clientId */
  getByClient(clientId: string, accessToken?: string): Promise<Trip[]> {
    return api.get<Trip[]>(`/trips/client/${clientId}`, withAuth(accessToken));
  },

  /** GET /trips/client/:clientId/range?from=&to= */
  getByDateRange(clientId: string, from: string, to: string, accessToken?: string): Promise<Trip[]> {
    const params = new URLSearchParams({ from, to });
    return api.get<Trip[]>(`/trips/client/${clientId}/range?${params}`, withAuth(accessToken));
  },

  /** POST /trips */
  create(body: CreateTripDto, accessToken?: string): Promise<Trip> {
    return api.post<Trip>('/trips', body, withAuth(accessToken));
  },

  /** PATCH /trips/:id */
  update(id: string, body: UpdateTripDto, accessToken?: string): Promise<Trip> {
    return api.patch<Trip>(`/trips/${id}`, body, withAuth(accessToken));
  },

  /** DELETE /trips/:id */
  remove(id: string, accessToken?: string): Promise<void> {
    return api.delete<void>(`/trips/${id}`, withAuth(accessToken));
  },
};
