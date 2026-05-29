import { UserProfile } from '../features/auth/types/user';
import { supabase } from './supabase';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('Missing EXPO_PUBLIC_API_URL');
}

type ApiRequestOptions = RequestInit & {
  accessToken: string;
};

type ApiResponse<T> = { success: true; data: T } | { success: false; message: string };

const buildUrl = (path: string) => `${apiUrl.replace(/\/$/, '')}${path}`;

export async function apiRequest<T>(path: string, { accessToken, headers, ...options }: ApiRequestOptions) {
  const makeRequest = (token: string) =>
    fetch(buildUrl(path), {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    });

  const response = await makeRequest(accessToken);

  if (response.status === 401) {
    const { data: refreshedSession } = await supabase.auth.refreshSession();
    const refreshedToken = refreshedSession.session?.access_token;

    if (refreshedToken && refreshedToken !== accessToken) {
      const retryResponse = await makeRequest(refreshedToken);

      if (retryResponse.ok) {
        const retryPayload = (await retryResponse.json()) as ApiResponse<T> | T;

        if (retryPayload && typeof retryPayload === 'object' && 'success' in retryPayload && 'data' in retryPayload) {
          if (!retryPayload.success) {
            throw new Error(retryPayload.message);
          }

          return retryPayload.data;
        }

        return retryPayload as T;
      }
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<T> | T;

  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    if (!payload.success) {
      throw new Error(payload.message);
    }

    return payload.data;
  }

  return payload as T;
}

export const getCurrentUserProfile = (accessToken: string) =>
  apiRequest<UserProfile>('/users/me', {
    accessToken,
    method: 'GET',
  });
