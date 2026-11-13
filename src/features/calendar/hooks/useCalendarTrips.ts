import { useEffect, useMemo, useState } from 'react';

import { clientsService } from '../../../services/clients';
import { defaultsService } from '../../../services/defaults';
import { paymentsService } from '../../../services';
import { useAuth } from '../../../state/AuthContext';
import type { Route } from '../../../services/types';
import { CreateCalendarTripInput, PendingSpecialTrip, Trip, TripMode, TripRecord, TripUpdates } from '../types';
import { toCreateTripPayloads } from '../data/tripMappers';
import { tripRepository } from '../data/tripRepository';
import { getClientTimezone } from '../../../utils/dateTime';
import { isNetworkError } from '../../../utils/isNetworkError';

type UseCalendarTripsResult = {
  trips: Trip[];
  tripsByDate: Record<string, Trip[]>;
  addTrip: (input: CreateCalendarTripInput & { markAsPaid?: boolean }) => void;
  addSpecialTrip: (input: PendingSpecialTrip & { markAsPaid?: boolean }) => void;
  markTripAsPaid: (tripId: string) => void;
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
  canMarkTripPaid?: boolean;
};

export const useCalendarTrips = ({
  selectedClientId,
  canCreateRegularTrips = false,
  canCreateSpecialTrips = false,
  canEdit = false,
  canDeleteTrips = false,
  canMarkTripPaid = false,
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
  const [clientTimezone, setClientTimezone] = useState<string>(getClientTimezone());

  const userId = userProfile?.id;
  const linkedClientId = userProfile?.linked_client_id;

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
          resolvedClientId = linkedClientId && (!selectedClientId || selectedClientId === linkedClientId)
            ? linkedClientId
            : undefined;
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

        if (isClient && !resolvedClientId) {
          throw new Error('No hay un cliente autorizado para cargar el calendario.');
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
  }, [selectedClientId, userId, linkedClientId]);

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

  const payTripRecordsAsPaid = async (records: TripRecord[]): Promise<boolean> => {
    for (const record of records) {
      const amount = record.final_price;
      if (amount <= 0) {
        return false;
      }
      try {
        await paymentsService.payTrip(record.id, { amount, method: 'transfer' });
      } catch {
        setError('El viaje se creó pero no se pudo registrar como pagado.');
        return false;
      }
    }
    return true;
  };

  const addTrip = userId && canCreateRegularTrips
    ? (input: CreateCalendarTripInput & { markAsPaid?: boolean }) => {
        const { dateKey, mode, time, note, routeId: requestedRouteId, markAsPaid = false } = input;
        let tripContext;

        try {
          tripContext = resolveTripContext();
        } catch (contextError) {
          setError(contextError instanceof Error ? contextError.message : 'Seleccioná un cliente con una ruta cargada antes de crear viajes.');
          return;
        }

        const effectiveRouteId = requestedRouteId ?? tripContext.routeId;

        (async () => {
          let payload: ReturnType<typeof toCreateTripPayloads> | undefined;

          try {
            payload = toCreateTripPayloads({
              dateKey,
              mode,
              time,
              note,
              ...tripContext,
              routeId: effectiveRouteId,
            });

            const { trip: createdTrip, records } = await tripRepository.createTrips(
              payload,
              userId,
              clientTimezone,
            );

            if (markAsPaid) {
              const paid = await payTripRecordsAsPaid(records);
              mergeTripIntoState(paid ? { ...createdTrip, paymentStatus: 'paid' } : createdTrip);
            } else {
              mergeTripIntoState(createdTrip);
            }
            warnIfZeroPrice(createdTrip);
          } catch (err: any) {
            if (isNetworkError(err) && payload) {
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
    ? (input: PendingSpecialTrip & { markAsPaid?: boolean }) => {
        const { dateKey, specialType, note, price, time, markAsPaid } = input;

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
          time,
          specialType,
          note,
          price,
          clientId: tripContext.clientId,
        });
        (async () => {
          try {
            const { trip: createdTrip, records } = await tripRepository.createTrips(
              payload,
              userId,
              clientTimezone,
            );

            if (markAsPaid) {
              const paid = await payTripRecordsAsPaid(records);
              mergeTripIntoState(paid ? { ...createdTrip, paymentStatus: 'paid' } : createdTrip);
            } else {
              mergeTripIntoState(createdTrip);
            }
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

  const markTripAsPaid = userId && canMarkTripPaid
    ? (tripId: string) => {
        const trip = trips.find((currentTrip) => currentTrip.id === tripId);
        if (!trip || trip.paymentStatus === 'paid') {
          return;
        }
        const records = tripRepository.getRecordsByIds(trip.recordIds);
        (async () => {
          const paid = await payTripRecordsAsPaid(records);
          if (paid) {
            mergeTripIntoState({ ...trip, paymentStatus: 'paid' });
          }
        })();
      }
    : userId
      ? createUnauthenticatedHandler('No tienes permisos para registrar pagos en este calendario.')
      : createUnauthenticatedHandler('No estás autenticado. Inicia sesión para registrar pagos.');

  const updateTrip = userId && canEdit
    ? (tripId: string, updates: TripUpdates) => {
        const trip = trips.find((currentTrip) => currentTrip.id === tripId);

        if (!trip) {
          return;
        }

        (async () => {
          try {
            await tripRepository.updateCalendarTrip(trip, updates, clientId, clientTimezone);
            const list = await tripRepository.listCalendarTrips(clientId || undefined, clientTimezone);
            setTrips(list);
          } catch (err: any) {
            if (isNetworkError(err)) {
              tripRepository.updateLocalCalendarTrip(trip, updates);
              setTrips(tripRepository.getLocalCalendarTrips(clientId || undefined, clientTimezone));
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
            await tripRepository.deleteCalendarTrip(trip, clientId, clientTimezone);
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
    markTripAsPaid,
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
