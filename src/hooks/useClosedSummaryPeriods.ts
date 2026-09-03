import { useEffect, useMemo, useState } from 'react';

import { summariesService } from '../services/summaries';
import type { Summary } from '../services/types';
import { getErrorMessage } from '../utils/errorMessage';
import { getClosedSummaryPeriods, findClosedSummaryPeriod } from '../utils/summaryPeriods';

export function useClosedSummaryPeriods(clientId: string | null | undefined, clientTimezone?: string) {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setSummaries([]);
      setError(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    summariesService.getAllByClient(clientId)
      .then((data) => {
        if (mounted) setSummaries(data);
      })
      .catch((err) => {
        if (mounted) {
          setSummaries([]);
          setError(getErrorMessage(err, 'No se pudieron cargar los períodos cerrados'));
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [clientId]);

  const periods = useMemo(
    () => getClosedSummaryPeriods(summaries, clientTimezone),
    [summaries, clientTimezone],
  );

  return {
    periods,
    loading,
    error,
    isDateClosed: (dateKey: string) => Boolean(findClosedSummaryPeriod(dateKey, periods)),
  };
}
