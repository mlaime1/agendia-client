import { api } from './backendApi';
import type {
  Client,
  CreateClientDto,
  UpdateClientDto,
  UpdateBillingDto,
  ServiceSchedule,
  CreateScheduleDto,
  UpdateScheduleDto,
  BulkSchedulesDto,
} from './types';

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

  // --- Schedules ---

  getSchedules(clientId: string): Promise<ServiceSchedule[]> {
    return api.get<ServiceSchedule[]>(`/clients/${clientId}/schedules`);
  },

  createSchedule(clientId: string, body: CreateScheduleDto): Promise<ServiceSchedule> {
    return api.post<ServiceSchedule>(`/clients/${clientId}/schedules`, body);
  },

  updateSchedule(clientId: string, scheduleId: string, body: UpdateScheduleDto): Promise<ServiceSchedule> {
    return api.patch<ServiceSchedule>(`/clients/${clientId}/schedules/${scheduleId}`, body);
  },

  deleteSchedule(clientId: string, scheduleId: string): Promise<void> {
    return api.delete<void>(`/clients/${clientId}/schedules/${scheduleId}`);
  },

  bulkReplaceSchedules(clientId: string, body: BulkSchedulesDto): Promise<ServiceSchedule[]> {
    return api.put<ServiceSchedule[]>(`/clients/${clientId}/schedules`, body);
  },
};
