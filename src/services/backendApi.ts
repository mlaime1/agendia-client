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
  const res = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

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