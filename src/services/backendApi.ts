import { supabase } from '../lib/supabase';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('Missing EXPO_PUBLIC_API_URL');
}

const API_REQUEST_TIMEOUT_MS = 15_000;

type ApiResponse<T> = { success: true; data: T } | { success: false; message: string };

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'HTTP_ERROR';

const getApiErrorCode = (status: number): ApiErrorCode => {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status >= 500) return 'SERVER_ERROR';
  return 'HTTP_ERROR';
};

const getApiErrorMessage = (status: number): string => {
  switch (status) {
    case 401:
      return 'Tu sesión ya no es válida. Volvé a iniciar sesión.';
    case 403:
      return 'No tenés permiso para realizar esta acción.';
    case 404:
      return 'No se encontró el recurso solicitado.';
    default:
      return status >= 500 ? 'El servidor no pudo completar la solicitud.' : `HTTP ${status}`;
  }
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message = getApiErrorMessage(status),
    public code: ApiErrorCode = getApiErrorCode(status),
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const parseApiResponse = <T>(text: string): ApiResponse<T> | null => {
  if (!text) return null;

  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !('success' in parsed)) return null;

    const response = parsed as { success?: unknown; data?: T; message?: unknown };
    if (response.success === true) return { success: true, data: response.data as T };
    if (response.success === false && typeof response.message === 'string') {
      return { success: false, message: response.message };
    }
  } catch {
    // Non-JSON responses are handled through the HTTP status below.
  }

  return null;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const json = parseApiResponse<T>(await response.text());

  if (!response.ok) {
    throw new ApiError(response.status, getApiErrorMessage(response.status));
  }

  if (!json) return undefined as T;
  if (!json.success) throw new ApiError(response.status, json.message);
  return json.data;
};

export const getBackendApiBaseUrl = () => apiUrl.replace(/\/$/, '');

const buildUrl = (path: string) => `${getBackendApiBaseUrl()}${path}`;

async function fetchWithTimeout(url: string, options: RequestInit = {}, ms = API_REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Tiempo de espera agotado al conectar con el servidor (${ms / 1000}s).`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  const makeRequest = async (authToken: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    if (options.headers) {
      const extra = options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : Array.isArray(options.headers)
          ? Object.fromEntries(options.headers)
          : options.headers as Record<string, string>;
      Object.assign(headers, extra);
    }

    return fetchWithTimeout(buildUrl(path), {
      ...options,
      headers,
    });
  };

  let res = await makeRequest(token);

  if (res.status === 401 && token) {
    try {
      const { data: refreshedSession } = await supabase.auth.refreshSession();
      const refreshedToken = refreshedSession.session?.access_token;

      if (refreshedToken && refreshedToken !== token) {
        res = await makeRequest(refreshedToken);
      }
    } catch {
      // The original 401 remains the authoritative response.
    }
  }

  if (res.status === 401) {
    await supabase.auth.signOut().catch(() => undefined);
  }

  return parseResponse<T>(res);
}

export async function fetchAuthenticated(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const makeRequest = (authToken: string | null) => {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
    return fetchWithTimeout(buildUrl(path), { ...options, headers });
  };

  let response = await makeRequest(token);
  if (response.status === 401 && token) {
    try {
      const { data } = await supabase.auth.refreshSession();
      const refreshedToken = data.session?.access_token;
      if (refreshedToken && refreshedToken !== token) response = await makeRequest(refreshedToken);
    } catch {
      // The original 401 remains the authoritative response.
    }
  }

  if (response.status === 401) await supabase.auth.signOut().catch(() => undefined);
  if (!response.ok) throw new ApiError(response.status);
  return response;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, options),

  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...(options ?? {}) }),

  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), ...(options ?? {}) }),

  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...(options ?? {}) }),

  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { method: 'DELETE', ...(options ?? {}) }),
};
