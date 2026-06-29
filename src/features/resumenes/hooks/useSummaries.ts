import { useCallback, useEffect, useState } from 'react';

import { summariesService } from '../../../services/summaries';
import type { Summary } from '../../../services/types';
import { getErrorMessage } from '../../../utils/errorMessage';

type UseSummariesState = {
  summaries: Summary[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useSummaries(clientId: string | null): UseSummariesState {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!clientId) {
      setSummaries([]);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await summariesService.getAllByClient(clientId);
        if (controller.signal.aborted) return;
        setSummaries(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(getErrorMessage(err, 'Error cargando resúmenes'));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => controller.abort();
  }, [clientId, refreshKey]);

  return { summaries, loading, error, refetch };
}
