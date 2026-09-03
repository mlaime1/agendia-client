import { useCallback, useEffect, useState } from 'react';

import { clientsService } from '../../../services/clients';
import { tripsService } from '../../../services/trips';
import { isSameClientMonth, getClientToday } from '../../../utils/dateTime';

type ProfileDriverStats = {
  activeClients: number | null;
  tripsThisMonth: number | null;
  loading: boolean;
  refetch: () => void;
};

const TRIPS_MONTH_MESSAGE = 'No se pudieron cargar las estadísticas';

export function useProfileDriverStats(enabled = true): ProfileDriverStats {
  const [activeClients, setActiveClients] = useState<number | null>(null);
  const [tripsThisMonth, setTripsThisMonth] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    if (!enabled) {
      setActiveClients(null);
      setTripsThisMonth(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const [clients, trips] = await Promise.all([
          clientsService.getAll(),
          tripsService.getAll(),
        ]);

        if (cancelled) return;

        const today = getClientToday();
        const monthTrips = trips.filter((trip) => isSameClientMonth(trip.trip_date, today));

        setActiveClients(clients.length);
        setTripsThisMonth(monthTrips.length);
      } catch {
        if (!cancelled) {
          console.warn(TRIPS_MONTH_MESSAGE);
          setActiveClients(null);
          setTripsThisMonth(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [enabled, refreshKey]);

  return { activeClients, tripsThisMonth, loading, refetch };
}