// src/services/apiClient.ts
// Wrapper base para todas las llamadas al backend Express

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type ApiResponse<T> = { success: true; data: T } | { success: false; message: string };

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    const message = !json.success ? json.message : `HTTP ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return json.data;
}

// Helpers para cada verbo
export const api = {
  get: <T>(path: string, options?: RequestInit) => request<T>(path, options),

  post: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), ...(options ?? {}) }),

  patch: <T>(path: string, body: unknown, options?: RequestInit) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...(options ?? {}) }),

  delete: <T>(path: string, options?: RequestInit) => request<T>(path, { method: 'DELETE', ...(options ?? {}) }),
};

export { ApiError };
