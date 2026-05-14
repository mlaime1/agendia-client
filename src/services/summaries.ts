// src/services/summaries.ts

import { api } from './apiClient';
import type {
  CreateSummaryAutoDto,
  Summary,
  BillingPreview,
  CreateSummaryManualDto,
  UpdateSummaryStatusDto,
} from './types';

const apiBaseUrl = (globalThis as { process?: { env?: { EXPO_PUBLIC_API_URL?: string } } }).process?.env
  ?.EXPO_PUBLIC_API_URL;

export const summariesService = {
  /** POST /summaries — creación manual con rango explícito */
  createManual(body: CreateSummaryManualDto): Promise<Summary> {
    return api.post<Summary>('/summaries', body);
  },

  /** POST /summaries/auto/:clientId — calcula período según billing config */
  createAuto(clientId: string, body: CreateSummaryAutoDto): Promise<Summary> {
    return api.post<Summary>(`/summaries/auto/${clientId}`, body);
  },

  /** GET /summaries/preview/:clientId?date=YYYY-MM-DD */
  preview(clientId: string, date?: string): Promise<BillingPreview> {
    const params = date ? `?date=${date}` : '';
    return api.get<BillingPreview>(`/summaries/preview/${clientId}${params}`);
  },

  /** GET /summaries/client/:clientId */
  getAllByClient(clientId: string): Promise<Summary[]> {
    return api.get<Summary[]>(`/summaries/client/${clientId}`);
  },

  /** GET /summaries/:id — incluye trips y relaciones */
  getById(id: string): Promise<Summary> {
    return api.get<Summary>(`/summaries/${id}`);
  },

  /**
   * GET /summaries/:id/pdf
   * Devuelve la URL lista para abrir con Linking.openURL() o WebBrowser
   */
  getPdfUrl(id: string): string {
    const base = apiBaseUrl ?? 'http://localhost:3000';
    return `${base}/summaries/${id}/pdf`;
  },

  /** PATCH /summaries/:id/status */
  updateStatus(id: string, body: UpdateSummaryStatusDto): Promise<Summary> {
    return api.patch<Summary>(`/summaries/${id}/status`, body);
  },

  /** DELETE /summaries/:id — desvincula trips antes de borrar */
  remove(id: string): Promise<void> {
    return api.delete<void>(`/summaries/${id}`);
  },
};
