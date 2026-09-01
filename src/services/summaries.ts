// src/services/summaries.ts

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { api, fetchAuthenticated, getBackendApiBaseUrl, getAccessToken } from './backendApi';
import type {
  CreateSummaryAutoDto,
  Summary,
  BillingPreview,
  CreateSummaryManualDto,
  UpdateSummaryStatusDto,
} from './types';

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
   * Devuelve la URL pública (requiere token; preferir sharePdf en la app).
   */
  getPdfUrl(id: string): string {
    return `${getBackendApiBaseUrl()}/summaries/${id}/pdf`;
  },

  /**
   * Descarga el PDF autenticado y lo comparte con el visor/sistema nativo.
   */
  async sharePdf(id: string): Promise<void> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const file = new FileSystem.File(FileSystem.Paths.cache, `summary-${id}.pdf`);

    const response = await fetchAuthenticated(`/summaries/${id}/pdf`);
    file.write(new Uint8Array(await response.arrayBuffer()));

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Compartir resumen',
    });
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
