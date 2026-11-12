import { ApiError, api } from './backendApi';

const GENERIC_MESSAGE = 'Si el correo está registrado, te enviamos una contraseña temporal.';

const THROTTLED_MESSAGE = 'Esperá unos minutos antes de volver a pedir el restablecimiento.';

const INVALID_EMAIL_MESSAGE = 'Ingresá un correo electrónico válido.';

const DELIVERY_ERROR_MESSAGE = 'No pudimos enviar el correo. Probá de nuevo en unos minutos.';

export type PasswordRecoveryResult = { message: string };

/**
 * Requests a temporary password. The backend answers the same generic message
 * whether or not the account exists, so this result never reveals it.
 */
export const passwordRecoveryService = {
  async request(email: string): Promise<PasswordRecoveryResult> {
    try {
      const data = await api.post<{ message?: string }>('/auth/password-recovery', {
        email: email.trim(),
      });

      return { message: data?.message ?? GENERIC_MESSAGE };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 429) {
          throw new Error(THROTTLED_MESSAGE);
        }

        if (error.status === 400) {
          throw new Error(INVALID_EMAIL_MESSAGE);
        }
      }

      throw new Error(DELIVERY_ERROR_MESSAGE);
    }
  },
};
