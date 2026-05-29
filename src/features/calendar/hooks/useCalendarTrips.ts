import { useEffect, useMemo, useState } from 'react';

import { clientsService } from '../../../services/clients';
import { defaultsService } from '../../../services/defaults';
import { useAuth } from '../../../state/AuthContext';
import { PendingSpecialTrip, Trip, TripMode, TripUpdates } from '../types';
import { toCreateTripPayloads } from '../data/tripMappers';
import { tripRepository } from '../data/tripRepository';

type UseCalendarTripsResult = {
  trips: Trip[];
  tripsByDate: Record<string, Trip[]>;
  addTrip: (dateKey: string, mode: TripMode) => void;
  addSpecialTrip: (input: PendingSpecialTrip) => void;
  updateTrip: (tripId: string, updates: TripUpdates) => void;
  deleteTrip: (tripId: string) => void;
  isLoadingTrips: boolean;
  error: string | null;
  clearError: () => void;
};

export const useCalendarTrips = (selectedClientId?: string): UseCalendarTripsResult => {
  const { session, userProfile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [routeId, setRouteId] = useState<string>('');
  const [rateId, setRateId] = useState<string>('');

  const userId = userProfile?.id;

  const clearError = () => setError(null);

  const createUnauthenticatedHandler = (message: string) => () => {
    setError(message);
  };

  const resolveTripContext = () => {
    const resolvedClientId = selectedClientId || clientId;

    if (!resolvedClientId || !routeId) {
      throw new Error('Seleccioná un cliente con una ruta cargada antes de crear viajes.');
    }

    return { clientId: resolvedClientId, routeId, rateId: rateId || undefined };
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (mounted) {
        setIsLoadingTrips(true);
      }

      if (!userId) {
        if (mounted) {
          setTrips([]);
          setIsLoadingTrips(false);
        }
        return;
      }

      try {
        const defaults = await defaultsService.getDefaults(session?.access_token);

        if (mounted && defaults.clientId && defaults.routeId) {
          setClientId(defaults.clientId);
          setRouteId(defaults.routeId);
          if (defaults.rateId) {
            setRateId(defaults.rateId);
          }
        }

        if (selectedClientId) {
          const selectedClient = await clientsService.getById(selectedClientId, session?.access_token);

          if (mounted) {
            setClientId(selectedClient.id);
            setRouteId(selectedClient.routes?.[0]?.id ?? '');
          }
        }

        const list = await tripRepository.listCalendarTrips(selectedClientId || defaults.clientId || undefined, session?.access_token);
        if (mounted) {
          setTrips(list);
        }
      } catch (err: any) {
        if (mounted) {
          setTrips([]);
          setError(err?.message ?? 'Error cargando viajes');
        }
      } finally {
        if (mounted) {
          setIsLoadingTrips(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedClientId, session?.access_token, userId]);

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

  const addTrip = userId
    ? (dateKey: string, mode: TripMode) => {
        let tripContext;

        try {
          tripContext = resolveTripContext();
        } catch (contextError) {
          setError(contextError instanceof Error ? contextError.message : 'Seleccioná un cliente con una ruta cargada antes de crear viajes.');
          return;
        }

        (async () => {
          try {
            const createdTrip = await tripRepository.createTrips(
              toCreateTripPayloads({ dateKey, mode, ...tripContext }),
              userId,
              session?.access_token,
            );
            mergeTripIntoState(createdTrip);
          } catch (err: any) {
            try {
              const fallback = tripRepository.createLocalTrips(
                toCreateTripPayloads({ dateKey, mode, ...tripContext }),
                userId,
                session?.access_token,
              );
              mergeTripIntoState(fallback);
            } catch {
              // no-op: keep user-facing error below
            }
            setError(err?.message ?? 'Error creando viaje');
          }
        })();
      }
    : createUnauthenticatedHandler('No estás autenticado. Inicia sesión para crear viajes.');

  const addSpecialTrip = userId
    ? (input: PendingSpecialTrip) => {
        const { dateKey, specialType, note } = input;

        let tripContext;

        try {
          tripContext = resolveTripContext();
        } catch (contextError) {
          setError(contextError instanceof Error ? contextError.message : 'Seleccioná un cliente con una ruta cargada antes de crear viajes.');
          return;
        }

        (async () => {
          try {
            const createdTrip = await tripRepository.createTrips(
              toCreateTripPayloads({
                dateKey,
                mode: 'special',
                specialType,
                note,
                ...tripContext,
              }),
              userId,
              session?.access_token,
            );
            mergeTripIntoState(createdTrip);
          } catch (err: any) {
            try {
              const fallback = tripRepository.createLocalTrips(
                toCreateTripPayloads({
                  dateKey,
                  mode: 'special',
                  specialType,
                  note,
                  ...tripContext,
                }),
                userId,
                session?.access_token,
              );
              mergeTripIntoState(fallback);
            } catch {
              // no-op: keep user-facing error below
            }
            setError(err?.message ?? 'Error creando viaje especial');
          }
        })();
      }
    : createUnauthenticatedHandler('No estás autenticado. Inicia sesión para crear viajes.');

  const updateTrip = userId
    ? (tripId: string, updates: TripUpdates) => {
        const trip = trips.find((currentTrip) => currentTrip.id === tripId);

        if (!trip) {
          return;
        }

        (async () => {
          try {
            await tripRepository.updateCalendarTrip(trip, updates, session?.access_token);
            const list = await tripRepository.listCalendarTrips(selectedClientId, session?.access_token);
            setTrips(list);
          } catch (err: any) {
            tripRepository.updateLocalCalendarTrip(trip, updates);
            setTrips(tripRepository.getLocalCalendarTrips(selectedClientId));
            setError(err?.message ?? 'Error actualizando viaje');
          }
        })();
      }
    : createUnauthenticatedHandler('No estás autenticado. Inicia sesión para actualizar viajes.');

  const deleteTrip = userId
    ? (tripId: string) => {
        const trip = trips.find((currentTrip) => currentTrip.id === tripId);

        if (!trip) {
          return;
        }

        const previousTrips = trips;
        setTrips((currentTrips) => currentTrips.filter((currentTrip) => currentTrip.id !== tripId));

        (async () => {
          try {
            await tripRepository.deleteCalendarTrip(trip, session?.access_token);
          } catch (err: any) {
            setTrips(previousTrips);
            setError(err?.message ?? 'Error eliminando viaje');
          }
        })();
      }
    : createUnauthenticatedHandler('No estás autenticado. Inicia sesión para eliminar viajes.');

  return {
    trips,
    tripsByDate,
    addTrip,
    addSpecialTrip,
    updateTrip,
    deleteTrip,
    isLoadingTrips,
    error,
    clearError,
  };
};
