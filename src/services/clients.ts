import { api } from './backendApi';
import type { Client, CreateClientDto, UpdateClientDto, UpdateBillingDto } from './types';

export const clientsService = {
  getAll(): Promise<Client[]> {
    return api.get<Client[]>('/clients');
  },

  getById(id: string): Promise<Client> {
    return api.get<Client>(`/clients/${id}`);
  },

  create(body: CreateClientDto): Promise<Client> {
    return api.post<Client>('/clients', body);
  },

  update(id: string, body: UpdateClientDto): Promise<Client> {
    return api.patch<Client>(`/clients/${id}`, body);
  },

  updateBilling(id: string, body: UpdateBillingDto): Promise<Client> {
    return api.patch<Client>(`/clients/${id}/billing`, body);
  },

  remove(id: string): Promise<void> {
    return api.delete<void>(`/clients/${id}`);
  },
};
