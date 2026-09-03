import { useState } from 'react';

import type { Summary, SummaryStatus } from '../../../services/types';
import { summariesService } from '../../../services/summaries';
import { tripsService } from '../../../services/trips';
import { useFeedback } from '../../../state/FeedbackContext';
import { getErrorMessage } from '../../../utils/errorMessage';
import { useAuth } from '../../../state/AuthContext';
import { usePermissions } from '../../../permissions';

type UseSummaryActionsState = {
  updating: boolean;
  deleting: boolean;
  reportingPayment: boolean;
  updateStatus: (summaryId: string, status: SummaryStatus) => Promise<Summary>;
  deleteSummary: (summaryId: string) => Promise<void>;
  reportPayment: (summary: Summary) => Promise<boolean>;
};

export function useSummaryActions(): UseSummaryActionsState {
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const { showFeedback } = useFeedback();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportingPayment, setReportingPayment] = useState(false);

  const updateStatus = async (summaryId: string, status: SummaryStatus): Promise<Summary> => {
    if (!permissions.can.summaryManagement) {
      throw new Error('No tienes permiso para modificar resúmenes.');
    }
    setUpdating(true);
    try {
      const summary = await summariesService.updateStatus(summaryId, { status });
      showFeedback({ type: 'success', message: 'Estado actualizado' });
      return summary;
    } catch (err) {
      const message = getErrorMessage(err, 'Error actualizando estado');
      showFeedback({ type: 'error', message });
      throw new Error(message);
    } finally {
      setUpdating(false);
    }
  };

  const deleteSummary = async (summaryId: string): Promise<void> => {
    if (!permissions.can.summaryManagement) {
      throw new Error('No tienes permiso para eliminar resúmenes.');
    }
    setDeleting(true);
    try {
      await summariesService.remove(summaryId);
      showFeedback({ type: 'success', message: 'Resumen eliminado' });
    } catch (err) {
      const message = getErrorMessage(err, 'Error eliminando resumen');
      showFeedback({ type: 'error', message });
      throw new Error(message);
    } finally {
      setDeleting(false);
    }
  };

  const reportPayment = async (summary: Summary): Promise<boolean> => {
    if (!permissions.can.summaries || !permissions.canAccessClient(summary.client_id)) {
      showFeedback({ type: 'error', message: 'No tienes permiso para informar pagos.' });
      return false;
    }

    const pendingTrips = (summary.trips ?? []).filter((trip) => trip.payment_status === 'pending');
    if (pendingTrips.length === 0) {
      showFeedback({ type: 'info', message: 'No hay viajes pendientes de pago en este resumen.' });
      return false;
    }

    setReportingPayment(true);
    try {
      await Promise.all(
        pendingTrips.map((trip) => tripsService.update(trip.id, { payment_status: 'partial' })),
      );
      showFeedback({ type: 'success', message: 'Pago informado correctamente' });
      return true;
    } catch (err) {
      showFeedback({
        type: 'error',
        message: getErrorMessage(err, 'Error al informar el pago'),
      });
      return false;
    } finally {
      setReportingPayment(false);
    }
  };

  return { updating, deleting, reportingPayment, updateStatus, deleteSummary, reportPayment };
}
