import { useState } from 'react';

import type { CreateSummaryAutoDto, CreateSummaryManualDto, Summary } from '../../../services/types';
import { summariesService } from '../../../services/summaries';
import { useFeedback } from '../../../state/FeedbackContext';
import { getErrorMessage } from '../../../utils/errorMessage';

type UseCreateSummaryState = {
  creating: boolean;
  createManual: (body: CreateSummaryManualDto) => Promise<Summary>;
  createAuto: (clientId: string, body: CreateSummaryAutoDto) => Promise<Summary>;
};

export function useCreateSummary(): UseCreateSummaryState {
  const { showFeedback } = useFeedback();
  const [creating, setCreating] = useState(false);

  const createManual = async (body: CreateSummaryManualDto): Promise<Summary> => {
    setCreating(true);
    try {
      const summary = await summariesService.createManual(body);
      showFeedback({ type: 'success', message: 'Resumen creado correctamente' });
      return summary;
    } catch (err) {
      const message = getErrorMessage(err, 'Error creando resumen');
      showFeedback({ type: 'error', message });
      throw new Error(message);
    } finally {
      setCreating(false);
    }
  };

  const createAuto = async (clientId: string, body: CreateSummaryAutoDto): Promise<Summary> => {
    setCreating(true);
    try {
      const summary = await summariesService.createAuto(clientId, body);
      showFeedback({ type: 'success', message: 'Resumen creado correctamente' });
      return summary;
    } catch (err) {
      const message = getErrorMessage(err, 'Error creando resumen');
      showFeedback({ type: 'error', message });
      throw new Error(message);
    } finally {
      setCreating(false);
    }
  };

  return { creating, createManual, createAuto };
}
