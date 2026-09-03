// src/services/summaries.ts

import * as FileSystem from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { api, fetchAuthenticated, getBackendApiBaseUrl, getAccessToken } from './backendApi';
import type {
  CreateSummaryAutoDto,
  Summary,
  BillingPreview,
  CreateSummaryManualDto,
  RegisterPaymentDto,
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

  /** GET /summaries/:id/pdf */
  getPdfUrl(id: string): string {
    return `${getBackendApiBaseUrl()}/summaries/${id}/pdf`;
  },

  /** Downloads the authenticated PDF to Android's public Downloads directory. */
  async downloadPdf(summary: Pick<Summary, 'id' | 'period_start' | 'period_end'>): Promise<string> {
    if (Platform.OS !== 'android') {
      throw new Error('La descarga directa en almacenamiento público solo está disponible en Android.');
    }

    const fileName = getPdfFileName(summary);
    const response = await fetchAuthenticated(`/summaries/${summary.id}/pdf`);
    const pdfBase64 = bytesToBase64(new Uint8Array(await response.arrayBuffer()));
    const directory = await getDownloadsDirectoryUri();

    try {
      return await writeSafPdf(directory.uri, fileName, pdfBase64);
    } catch (error) {
      // A persisted SAF grant can be revoked. Retry once with a fresh grant in
      // the same action, but never loop if the replacement directory fails.
      if (!directory.fromStoredGrant) throw error;
      await AsyncStorage.removeItem(DOWNLOADS_URI_KEY);
      const replacementUri = await requestDownloadsDirectoryUri();
      return writeSafPdf(replacementUri, fileName, pdfBase64);
    }
  },

  /** Downloads the authenticated PDF and opens the native share sheet. */
  async sharePdf(summary: Pick<Summary, 'id' | 'period_start' | 'period_end'>): Promise<void> {
    const uri = await writePdf(summary, FileSystem.Paths.cache);
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Compartir resumen',
    });
  },

  /** PATCH /summaries/:id/status */
  updateStatus(id: string, body: UpdateSummaryStatusDto): Promise<Summary> {
    return api.patch<Summary>(`/summaries/${id}/status`, body);
  },

  /** POST /summaries/:id/report-payment — no body */
  reportPayment(id: string): Promise<Summary> {
    return api.post<Summary>(`/summaries/${id}/report-payment`, undefined);
  },

  /** POST /summaries/:id/pay — registra un pago real */
  pay(id: string, body: RegisterPaymentDto): Promise<Summary> {
    return api.post<Summary>(`/summaries/${id}/pay`, body);
  },

  /** DELETE /summaries/:id — desvincula trips antes de borrar */
  remove(id: string): Promise<void> {
    return api.delete<void>(`/summaries/${id}`);
  },
};

async function writePdf(
  summary: Pick<Summary, 'id' | 'period_start' | 'period_end'>,
  directory: FileSystem.Directory,
): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión activa');
  }

  const fileName = getPdfFileName(summary);
  const file = new FileSystem.File(directory, fileName);

  const response = await fetchAuthenticated(`/summaries/${summary.id}/pdf`);
  file.write(new Uint8Array(await response.arrayBuffer()));

  return file.uri;
}

const DOWNLOADS_URI_KEY = '@agendia/android-downloads-uri';

async function getDownloadsDirectoryUri(): Promise<{ uri: string; fromStoredGrant: boolean }> {
  const storedUri = await AsyncStorage.getItem(DOWNLOADS_URI_KEY);
  if (storedUri) {
    try {
      await LegacyFileSystem.StorageAccessFramework.readDirectoryAsync(storedUri);
      return { uri: storedUri, fromStoredGrant: true };
    } catch {
      await AsyncStorage.removeItem(DOWNLOADS_URI_KEY);
    }
  }

  return { uri: await requestDownloadsDirectoryUri(), fromStoredGrant: false };
}

async function requestDownloadsDirectoryUri(): Promise<string> {
  const initialUri = LegacyFileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
  const permission = await LegacyFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUri);

  if (!permission.granted) {
    throw new Error('No se otorgó permiso para guardar el PDF en la carpeta Descargas de Android.');
  }

  await AsyncStorage.setItem(DOWNLOADS_URI_KEY, permission.directoryUri);
  return permission.directoryUri;
}

async function writeSafPdf(directoryUri: string, fileName: string, pdfBase64: string): Promise<string> {
  const fileUri = await LegacyFileSystem.StorageAccessFramework.createFileAsync(
    directoryUri,
    fileName,
    'application/pdf',
  );
  await LegacyFileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, pdfBase64, {
    encoding: LegacyFileSystem.EncodingType.Base64,
  });
  return fileUri;
}

function getPdfFileName(summary: Pick<Summary, 'id' | 'period_start' | 'period_end'>): string {
  return [
    'resumen',
    sanitizeFilenameDate(summary.period_start),
    'al',
    sanitizeFilenameDate(summary.period_end),
    sanitizeFilenamePart(summary.id),
  ].join('-') + '.pdf';
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function sanitizeFilenameDate(value: string): string {
  const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? value;
  return sanitizeFilenamePart(isoDate, 'sin-fecha');
}

function sanitizeFilenamePart(value: string, fallback = 'sin-dato'): string {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return sanitized || fallback;
}
