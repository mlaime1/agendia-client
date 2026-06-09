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

async function getAccessToken(): Promise<string | null> {
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

    return fetch(buildUrl(path), {
      ...options,
      headers,
    });
  };

  const res = await makeRequest(token);

  if (res.status === 401 && token) {
    const { data: refreshedSession } = await supabase.auth.refreshSession();
    const refreshedToken = refreshedSession.session?.access_token;

    if (refreshedToken && refreshedToken !== token) {
      const retryRes = await makeRequest(refreshedToken);

      if (retryRes.ok) {
        const retryText = await retryRes.text();
        const retryJson = retryText ? (JSON.parse(retryText) as ApiResponse<T>) : null;

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

  put: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), ...(options ?? {}) }),

  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...(options ?? {}) }),

  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { method: 'DELETE', ...(options ?? {}) }),
};
