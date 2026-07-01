import { useEffect, useMemo, useState } from 'react';

import { clientsService } from '../../../services/clients';
import { defaultsService } from '../../../services/defaults';
import { itinerariesService } from '../../../services/itineraries';
import { useAuth } from '../../../state/AuthContext';
import type { ItineraryRate, Route } from '../../../services/types';
import { PendingSpecialTrip, Trip, TripMode, TripUpdates } from '../types';
import { toCreateTripPayloads } from '../data/tripMappers';
import { tripRepository } from '../data/tripRepository';
import { getClientTimezone } from '../../../utils/dateTime';
import { isNetworkError } from '../../../utils/isNetworkError';

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
  clientTimezone: string;
  routeId: string;
  setRouteId: (routeId: string) => void;
  availableRoutes: Route[];
};

type UseCalendarTripsOptions = {
  selectedClientId?: string;
  canCreateRegularTrips?: boolean;
  canCreateSpecialTrips?: boolean;
  canEdit?: boolean;
  canDeleteTrips?: boolean;
};

export const useCalendarTrips = ({
  selectedClientId,
  canCreateRegularTrips = false,
  canCreateSpecialTrips = false,
  canEdit = false,
  canDeleteTrips = false,
}: UseCalendarTripsOptions = {}): UseCalendarTripsResult => {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role;
  const isClient = userRole === 'client';
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [routeId, setRouteId] = useState<string>('');
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [availableRates, setAvailableRates] = useState<ItineraryRate[]>([]);
  const [clientTimezone, setClientTimezone] = useState<string>(getClientTimezone());

  const userId = userProfile?.id;

  const clearError = () => setError(null);

  const createUnauthenticatedHandler = (message: string) => () => {
    setError(message);
  };

  const resolveTripContext = (requiresRoute = true) => {
    const resolvedClientId = selectedClientId || clientId;

    if (!resolvedClientId) {
      throw new Error('Seleccioná un cliente antes de crear viajes.');
    }

    if (requiresRoute && !routeId) {
      throw new Error('Seleccioná una ruta antes de crear viajes.');
    }

    return { clientId: resolvedClientId, routeId };
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (mounted) {
        setIsLoadingTrips(true);
        setAvailableRates([]);
      }

      if (!userId) {
        if (mounted) {
          setTrips([]);
          setIsLoadingTrips(false);
        }
        return;
      }

      try {
        let resolvedClientId: string | undefined = selectedClientId;
        let resolvedRouteId = '';
        let resolvedTimezone = getClientTimezone();
        let resolvedRoutes: Route[] = [];

        if (isClient) {
          resolvedClientId = selectedClientId;
        } else {
          const defaults = await defaultsService.getDefaults();
          resolvedClientId = selectedClientId || defaults.clientId || undefined;
          resolvedRouteId = defaults.routeId || '';
        }

        if (resolvedClientId) {
          const clientDetail = await clientsService.getById(resolvedClientId);

          resolvedRoutes = clientDetail.routes ?? [];
          resolvedTimezone = getClientTimezone(clientDetail);

          const activeRoute = resolvedRoutes.find((route) => route.is_active !== false);
          resolvedRouteId = resolvedRouteId || activeRoute?.id || '';
        }

        if (mounted) {
          setClientId(resolvedClientId || '');
          setRouteId(resolvedRouteId);
          setAvailableRoutes(resolvedRoutes);
          setClientTimezone(resolvedTimezone);
        }

        const list = await tripRepository.listCalendarTrips(resolvedClientId, resolvedTimezone);
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
  }, [selectedClientId, userId]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!routeId) {
        if (mounted) {
          setAvailableRates([]);
        }
        return;
      }

      try {
        const rates = await itinerariesService.getRates(routeId);
        if (mounted) {
          setAvailableRates(rates);
        }
      } catch {
        if (mounted) {
          setAvailableRates([]);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [routeId]);

  const resolveRateId = (mode: TripMode): string | null => {
    if (mode === 'special') {
      return null;
    }

    const tripType = mode === 'roundTrip' ? 'ida_y_vuelta' : 'ida';
    return availableRates.find((rate) => rate.trip_type === tripType)?.id ?? null;
  };

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

  const warnIfZeroPrice = (trip: Trip) => {
    if (trip.finalPrice === 0) {
      setError('El viaje se registró con precio $0. Verificá que la tarifa esté configurada.');
    }
  };

  const addTrip = userId && canCreateRegularTrips
    ? (dateKey: string, mode: TripMode) => {
        let tripContext;

        try {
          tripContext = resolveTripContext();
        } catch (contextError) {
          setError(contextError instanceof Error ? contextError.message : 'Seleccioná un cliente con una ruta cargada antes de crear viajes.');
          return;
        }

        const rateId = resolveRateId(mode);
        const payload = toCreateTripPayloads({ dateKey, mode, rateId: rateId ?? null, ...tripContext });

        (async () => {
          try {
            const createdTrip = await tripRepository.createTrips(
              payload,
              userId,
              clientTimezone,
            );
            mergeTripIntoState(createdTrip);
            warnIfZeroPrice(createdTrip);
          } catch (err: any) {
            if (isNetworkError(err)) {
              try {
                const fallback = tripRepository.createLocalTrips(
                  payload,
                  userId,
                  clientTimezone,
                );
                mergeTripIntoState(fallback);
              } catch {
                // no-op
              }
            }
            setError(err?.message ?? 'Error creando viaje');
          }
        })();
      }
    : userId
      ? createUnauthenticatedHandler('No tienes permisos para crear viajes regulares en este calendario.')
      : createUnauthenticatedHandler('No estás autenticado. Inicia sesión para crear viajes.');

  const addSpecialTrip = userId && canCreateSpecialTrips
    ? (input: PendingSpecialTrip) => {
        const { dateKey, specialType, note, price } = input;

        let tripContext;

        try {
          tripContext = resolveTripContext(false);
        } catch (contextError) {
          setError(contextError instanceof Error ? contextError.message : 'Seleccioná un cliente antes de crear viajes.');
          return;
        }

        const payload = toCreateTripPayloads({
          dateKey,
          mode: 'special',
          specialType,
          note,
          price,
          clientId: tripContext.clientId,
        });

        (async () => {
          try {
            const createdTrip = await tripRepository.createTrips(
              payload,
              userId,
              clientTimezone,
            );
            mergeTripIntoState(createdTrip);
            warnIfZeroPrice(createdTrip);
          } catch (err: any) {
            if (isNetworkError(err)) {
              try {
                const fallback = tripRepository.createLocalTrips(
                  payload,
                  userId,
                  clientTimezone,
                );
                mergeTripIntoState(fallback);
              } catch {
                // no-op
              }
            }
            setError(err?.message ?? 'Error creando viaje especial');
          }
        })();
      }
    : userId
      ? createUnauthenticatedHandler('No tienes permisos para crear viajes especiales en este calendario.')
      : createUnauthenticatedHandler('No estás autenticado. Inicia sesión para crear viajes.');

  const updateTrip = userId && canEdit
    ? (tripId: string, updates: TripUpdates) => {
        const trip = trips.find((currentTrip) => currentTrip.id === tripId);

        if (!trip) {
          return;
        }

        (async () => {
          try {
            await tripRepository.updateCalendarTrip(trip, updates, clientTimezone);
            const list = await tripRepository.listCalendarTrips(selectedClientId, clientTimezone);
            setTrips(list);
          } catch (err: any) {
            if (isNetworkError(err)) {
              tripRepository.updateLocalCalendarTrip(trip, updates);
              setTrips(tripRepository.getLocalCalendarTrips(selectedClientId, clientTimezone));
            }
            setError(err?.message ?? 'Error actualizando viaje');
          }
        })();
      }
    : userId
      ? createUnauthenticatedHandler('No tienes permisos para actualizar viajes en este calendario.')
      : createUnauthenticatedHandler('No estás autenticado. Inicia sesión para actualizar viajes.');

  const deleteTrip = userId && canDeleteTrips
    ? (tripId: string) => {
        const trip = trips.find((currentTrip) => currentTrip.id === tripId);

        if (!trip) {
          return;
        }

        const previousTrips = trips;
        setTrips((currentTrips) => currentTrips.filter((currentTrip) => currentTrip.id !== tripId));

        (async () => {
          try {
            await tripRepository.deleteCalendarTrip(trip, clientTimezone);
          } catch (err: any) {
            setTrips(previousTrips);
            setError(err?.message ?? 'Error eliminando viaje');
          }
        })();
      }
    : userId
      ? createUnauthenticatedHandler('No tienes permisos para eliminar viajes en este calendario.')
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
    clientTimezone,
    routeId,
    setRouteId,
    availableRoutes,
  };
};
