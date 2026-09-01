import { ApiError } from '../services/backendApi';

export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return fallback;
}
