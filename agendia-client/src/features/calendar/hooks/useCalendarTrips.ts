import { useEffect, useMemo, useState } from 'react';

import { toCreateTripPayloads } from '../data/tripMappers';
import { tripRepository } from '../data/tripRepository';
import { PendingSpecialTrip, Trip, TripMode, TripUpdates } from '../types';

export const useCalendarTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const list = await tripRepository.listCalendarTrips();
        if (mounted) setTrips(list);
      } catch (err: any) {
        if (mounted) {
          setTrips(tripRepository.getLocalCalendarTrips());
          setError(err?.message ?? 'Error cargando viajes');
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const tripsByDate = useMemo(
    () =>
      trips.reduce<Record<string, Trip[]>>((groupedTrips, trip) => {
        groupedTrips[trip.date] = [...(groupedTrips[trip.date] ?? []), trip].sort((left, right) =>
          left.time.localeCompare(right.time),
        );
        return groupedTrips;
      }, {}),
    [trips],
  );

  const addTrip = (dateKey: string, mode: TripMode) => {
    (async () => {
      try {
        await tripRepository.createTrips(toCreateTripPayloads({ dateKey, mode }));
        const list = await tripRepository.listCalendarTrips();
        setTrips(list);
      } catch (err: any) {
        // fallback local create
        const fallback = tripRepository.createLocalTrips(toCreateTripPayloads({ dateKey, mode }));
        setTrips(tripRepository.getLocalCalendarTrips());
        setError(err?.message ?? 'Error creando viaje');
        return fallback;
      }
    })();
  };

  const addSpecialTrip = ({ dateKey, specialType, note }: PendingSpecialTrip) => {
    (async () => {
      try {
        await tripRepository.createTrips(
          toCreateTripPayloads({ dateKey, mode: 'special', specialType, note }),
        );
        const list = await tripRepository.listCalendarTrips();
        setTrips(list);
      } catch (err: any) {
        const fallback = tripRepository.createLocalTrips(
          toCreateTripPayloads({ dateKey, mode: 'special', specialType, note }),
        );
        setTrips(tripRepository.getLocalCalendarTrips());
        setError(err?.message ?? 'Error creando viaje especial');
        return fallback;
      }
    })();
  };

  const updateTrip = (tripId: string, updates: TripUpdates) => {
    const trip = trips.find((currentTrip) => currentTrip.id === tripId);

    if (!trip) {
      return;
    }

    (async () => {
      try {
        await tripRepository.updateCalendarTrip(trip, updates);
        const list = await tripRepository.listCalendarTrips();
        setTrips(list);
      } catch (err: any) {
        tripRepository.updateLocalCalendarTrip(trip, updates);
        setTrips(tripRepository.getLocalCalendarTrips());
        setError(err?.message ?? 'Error actualizando viaje');
      }
    })();
  };

  return {
    trips,
    tripsByDate,
    addTrip,
    addSpecialTrip,
    updateTrip,
    error,
    clearError,
  };
};
