import { UserProfile } from '../features/auth/types/user';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('Missing EXPO_PUBLIC_API_URL');
}

type ApiRequestOptions = RequestInit & {
  accessToken: string;
};

const buildUrl = (path: string) => `${apiUrl.replace(/\/$/, '')}${path}`;

export async function apiRequest<T>(path: string, { accessToken, headers, ...options }: ApiRequestOptions) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export const getCurrentUserProfile = (accessToken: string) =>
  apiRequest<UserProfile>('/users/me', {
    accessToken,
    method: 'GET',
  });
