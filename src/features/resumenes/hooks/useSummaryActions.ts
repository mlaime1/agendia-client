import { useState } from 'react';

import type { Summary, SummaryStatus } from '../../../services/types';
import { summariesService } from '../../../services/summaries';
import { useFeedback } from '../../../state/FeedbackContext';
import { getErrorMessage } from '../../../utils/errorMessage';

type UseSummaryActionsState = {
  updating: boolean;
  deleting: boolean;
  updateStatus: (summaryId: string, status: SummaryStatus) => Promise<Summary>;
  deleteSummary: (summaryId: string) => Promise<void>;
};

export function useSummaryActions(): UseSummaryActionsState {
  const { showFeedback } = useFeedback();
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const updateStatus = async (summaryId: string, status: SummaryStatus): Promise<Summary> => {
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

  return { updating, deleting, updateStatus, deleteSummary };
}
