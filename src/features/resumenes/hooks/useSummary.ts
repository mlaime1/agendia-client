import { useCallback, useEffect, useState } from 'react';

import { summariesService } from '../../../services/summaries';
import type { Summary } from '../../../services/types';
import { getErrorMessage } from '../../../utils/errorMessage';

type UseSummaryState = {
  summary: Summary | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useSummary(summaryId: string | null): UseSummaryState {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!summaryId) {
      setSummary(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await summariesService.getById(summaryId);
        if (controller.signal.aborted) return;
        setSummary(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(err, 'Error cargando resumen'));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => controller.abort();
  }, [summaryId, refreshKey]);

  return { summary, loading, error, refetch };
}
