import { ApiError } from '../services/backendApi';

export function isNetworkError(error: unknown): boolean {
  // If the backend responded with an HTTP status, it's not a network error.
  if (error instanceof ApiError) {
    return false;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('abort') ||
      message.includes('failed to fetch')
    );
  }

  return false;
}
