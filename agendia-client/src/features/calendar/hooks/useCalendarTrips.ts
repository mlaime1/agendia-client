import { useEffect, useMemo, useState } from 'react';

import { toCreateTripPayloads } from '../data/tripMappers';
import { tripRepository } from '../data/tripRepository';
import { PendingSpecialTrip, Trip, TripMode, TripUpdates } from '../types';
import { useAuth } from '../../../state/AuthContext';
import { defaultsService } from '../../../services/defaults';

export const useCalendarTrips = () => {
  const { userProfile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('3');
  const [routeId, setRouteId] = useState<string>('3');
  const [rateId, setRateId] = useState<string>('1');

  const clearError = () => setError(null);

  const userId = userProfile?.id;

  if (!userId) {
    return {
      trips: [],
      tripsByDate: {},
      addTrip: () => {
        setError('No estás autenticado. Inicia sesión para crear viajes.');
      },
      addSpecialTrip: () => {
        setError('No estás autenticado. Inicia sesión para crear viajes.');
      },
      updateTrip: () => {
        setError('No estás autenticado. Inicia sesión para actualizar viajes.');
      },
      error,
      clearError,
    };
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const defaults = await defaultsService.getDefaults();
        if (mounted && defaults.clientId && defaults.routeId) {
          setClientId(defaults.clientId);
          setRouteId(defaults.routeId);
          if (defaults.rateId) {
            setRateId(defaults.rateId);
          }
        }

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

  const mergeTripIntoState = (nextTrip: Trip) => {
    setTrips((currentTrips) => {
      const remainingTrips = currentTrips.filter((trip) => trip.id !== nextTrip.id);
      return [...remainingTrips, nextTrip].sort((left, right) =>
        left.date.localeCompare(right.date) || left.time.localeCompare(right.time),
      );
    });
  };

  const addTrip = (dateKey: string, mode: TripMode) => {
    (async () => {
      try {
        const createdTrip = await tripRepository.createTrips(
          toCreateTripPayloads({ dateKey, mode, clientId, routeId, rateId }),
          userId,
        );
        mergeTripIntoState(createdTrip);
      } catch (err: any) {
        // fallback local create
        const fallback = tripRepository.createLocalTrips(
          toCreateTripPayloads({ dateKey, mode, clientId, routeId, rateId }),
          userId,
        );
        mergeTripIntoState(fallback);
        setError(err?.message ?? 'Error creando viaje');
        return fallback;
      }
    })();
  };

  const addSpecialTrip = ({ dateKey, specialType, note }: PendingSpecialTrip) => {
    (async () => {
      try {
        const createdTrip = await tripRepository.createTrips(
          toCreateTripPayloads({ dateKey, mode: 'special', specialType, note, clientId, routeId, rateId }),
          userId,
        );
        mergeTripIntoState(createdTrip);
      } catch (err: any) {
        const fallback = tripRepository.createLocalTrips(
          toCreateTripPayloads({ dateKey, mode: 'special', specialType, note, clientId, routeId, rateId }),
          userId,
        );
        mergeTripIntoState(fallback);
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
