import { supabase } from '../lib/supabase';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('Missing EXPO_PUBLIC_API_URL');
}

type ApiResponse<T> = { success: true; data: T } | { success: false; message: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const getBackendApiBaseUrl = () => apiUrl.replace(/\/$/, '');

const buildUrl = (path: string) => `${getBackendApiBaseUrl()}${path}`;

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const makeRequest = (headers: HeadersInit | undefined) =>
    fetch(buildUrl(path), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(headers ?? {}),
      },
    });

  const getAuthHeader = (headers: HeadersInit | undefined) => {
    if (!headers) return null;
    if (Array.isArray(headers)) {
      const match = headers.find(([key]) => key.toLowerCase() === 'authorization');
      return match?.[1] ?? null;
    }

    if (headers instanceof Headers) {
      return headers.get('Authorization');
    }

    const record = headers as Record<string, string>;
    return record.Authorization ?? record.authorization ?? null;
  };

  const res = await makeRequest(options.headers);
  const authHeader = getAuthHeader(options.headers);

  if (res.status === 401 && authHeader?.startsWith('Bearer ')) {
    const { data: refreshedSession } = await supabase.auth.refreshSession();
    const refreshedToken = refreshedSession.session?.access_token;

    if (refreshedToken) {
      const retryHeaders = new Headers(options.headers ?? undefined);
      retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);

      const retryRes = await makeRequest(retryHeaders);

      if (retryRes.ok) {
        const retryResponseText = await retryRes.text();
        const retryJson = retryResponseText ? (JSON.parse(retryResponseText) as ApiResponse<T>) : null;

        if (!retryJson) {
          return undefined as T;
        }

        if (!retryJson.success) {
          throw new ApiError(retryRes.status, retryJson.message);
        }

        return retryJson.data;
      }
    }
  }

  const responseText = await res.text();
  const json = responseText ? (JSON.parse(responseText) as ApiResponse<T>) : null;

  if (!res.ok) {
    const message = json && !json.success ? json.message : `HTTP ${res.status}`;
    throw new ApiError(res.status, message);
  }

  if (!json) {
    return undefined as T;
  }

  if (!json.success) {
    throw new ApiError(res.status, json.message);
  }

  return json.data;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, options),

  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...(options ?? {}) }),

  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...(options ?? {}) }),

  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { method: 'DELETE', ...(options ?? {}) }),
};