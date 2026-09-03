import { useState } from 'react';

import type { Summary, SummaryStatus } from '../../../services/types';
import { summariesService } from '../../../services/summaries';
import { useFeedback } from '../../../state/FeedbackContext';
import { getErrorMessage } from '../../../utils/errorMessage';
import { useAuth } from '../../../state/AuthContext';
import { usePermissions } from '../../../permissions';

type UseSummaryActionsState = {
  updating: boolean;
  deleting: boolean;
  reportingPayment: boolean;
  paying: boolean;
  updateStatus: (summaryId: string, status: SummaryStatus) => Promise<Summary>;
  deleteSummary: (summaryId: string) => Promise<void>;
  reportPayment: (summary: Summary) => Promise<boolean>;
  markAsPaid: (summary: Summary) => Promise<Summary>;
};

export function useSummaryActions(): UseSummaryActionsState {
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const { showFeedback } = useFeedback();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportingPayment, setReportingPayment] = useState(false);
  const [paying, setPaying] = useState(false);

  const updateStatus = async (summaryId: string, status: SummaryStatus): Promise<Summary> => {
    if (!permissions.can.summaryManagement) {
      throw new Error('No tienes permiso para modificar resúmenes.');
    }
    if (!['draft', 'sent', 'archived'].includes(status)) {
      throw new Error('Los estados de pago deben gestionarse mediante sus acciones específicas.');
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

    if (summary.status !== 'sent') {
      return false;
    }

    setReportingPayment(true);
    try {
      await summariesService.reportPayment(summary.id);
      showFeedback({ type: 'success', message: 'Pago informado' });
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

  const markAsPaid = async (summary: Summary): Promise<Summary> => {
    if (!permissions.can.summaryManagement || !permissions.canAccessClient(summary.client_id)) {
      throw new Error('No tienes permiso para registrar pagos.');
    }
    const amount = Math.max(0, parseFloat(summary.total_amount) - parseFloat(summary.paid_amount || '0'));
    setPaying(true);
    try {
      const updated = await summariesService.pay(summary.id, { amount, method: 'transfer' });
      showFeedback({ type: 'success', message: 'Resumen marcado como abonado' });
      return updated;
    } catch (err) {
      const message = getErrorMessage(err, 'Error al registrar el pago');
      showFeedback({ type: 'error', message });
      throw new Error(message);
    } finally {
      setPaying(false);
    }
  };

  return {
    updating, deleting, reportingPayment, paying,
    updateStatus, deleteSummary, reportPayment, markAsPaid,
  };
}
