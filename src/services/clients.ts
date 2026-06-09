// src/services/clients.ts

import { api } from './backendApi';
import type { Client, CreateClientDto, UpdateClientDto, UpdateBillingDto } from './types';

const withAuth = (accessToken?: string) =>
  accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined;

export const clientsService = {
  /** GET /clients */
  getAll(accessToken?: string): Promise<Client[]> {
    return api.get<Client[]>('/clients', withAuth(accessToken));
  },

  /** GET /clients/:id — incluye routes y últimas 5 summaries */
  getById(id: string, accessToken?: string): Promise<Client> {
    return api.get<Client>(`/clients/${id}`, withAuth(accessToken));
  },

  /** POST /clients */
  create(body: CreateClientDto): Promise<Client> {
    return api.post<Client>('/clients', body);
  },

  /** PATCH /clients/:id */
  update(id: string, body: UpdateClientDto): Promise<Client> {
    return api.patch<Client>(`/clients/${id}`, body);
  },

  /** PATCH /clients/:id/billing */
  updateBilling(id: string, body: UpdateBillingDto): Promise<Client> {
    return api.patch<Client>(`/clients/${id}/billing`, body);
  },

  /** DELETE /clients/:id */
  remove(id: string): Promise<void> {
    return api.delete<void>(`/clients/${id}`);
  },
};
