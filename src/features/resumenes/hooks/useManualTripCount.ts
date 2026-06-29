import { useEffect, useState } from 'react';

import { tripsService } from '../../../services/trips';
import { getErrorMessage } from '../../../utils/errorMessage';

type UseManualTripCountState = {
  availableTrips: number;
  loading: boolean;
  error: string | null;
};

export function useManualTripCount(
  clientId: string | null,
  from: string | null,
  to: string | null,
): UseManualTripCountState {
  const [state, setState] = useState<UseManualTripCountState>({
    availableTrips: 0,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!clientId || !from || !to) {
      setState({ availableTrips: 0, loading: false, error: null });
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const trips = await tripsService.getByDateRange(clientId, from, to);
        if (controller.signal.aborted) return;
        const availableTrips = trips.filter((trip) => !trip.summary_id).length;
        setState({ availableTrips, loading: false, error: null });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({
          availableTrips: 0,
          loading: false,
          error: getErrorMessage(err, 'Error contando viajes disponibles'),
        });
      }
    };

    load();

    return () => controller.abort();
  }, [clientId, from, to]);

  return state;
}
