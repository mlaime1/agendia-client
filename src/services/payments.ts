import { api } from './backendApi';
import type { Payment, RegisterPaymentDto } from './types';

export const paymentsService = {
  /** POST /payments/trip/:tripId — registra un pago real sobre un viaje específico */
  payTrip(tripId: string, body: RegisterPaymentDto): Promise<Payment> {
    return api.post<Payment>(`/payments/trip/${tripId}`, body);
  },
};
