import { useEffect, useMemo, useState } from 'react';

import { tripsService } from '../../../services/trips';
import type { Trip as ServiceTrip } from '../../../services/types';
import type { Trip, TripMode } from '../../calendar/types';
import { formatClientTime, getClientDateKey, getClientMonthDays } from '../../../utils/dateTime';
import { getErrorMessage } from '../../../utils/errorMessage';

type ManualMonthTripsState = {
  tripsByDate: Record<string, Trip[]>;
  loading: boolean;
  error: string | null;
};

const EMPTY_STATE: ManualMonthTripsState = {
  tripsByDate: {},
  loading: false,
  error: null,
};

type CalendarTripCandidate = Trip & { rawType: string };

const isOutboundType = (tripType: string) => tripType === 'ida' || tripType === 'outbound';
const isReturnType = (tripType: string) => tripType === 'vuelta' || tripType === 'return';

const normalizeTripMode = (tripType: string): TripMode => {
  if (isOutboundType(tripType) || isReturnType(tripType)) return 'outbound';
  if (tripType === 'ida y vuelta' || tripType === 'ida_y_vuelta' || tripType === 'roundTrip') {
    return 'roundTrip';
  }
  return 'special';
};

const toTrip = (candidate: CalendarTripCandidate): Trip => ({
  id: candidate.id,
  recordIds: candidate.recordIds,
  date: candidate.date,
  time: candidate.time,
  mode: candidate.mode,
  routeId: candidate.routeId,
  specialType: candidate.specialType,
  note: candidate.note,
  finalPrice: candidate.finalPrice,
  paymentStatus: candidate.paymentStatus,
  paidAmount: candidate.paidAmount,
});

const toCalendarTripCandidates = (
  serviceTrips: ServiceTrip[],
  clientTimezone?: string,
): CalendarTripCandidate[] =>
  serviceTrips.map((trip, index) => {
    const tripDate = trip.trip_date || new Date().toISOString();
    const id = trip.id || `trip-${index}`;
    const rawType = String(trip.trip_type ?? '');
    const specialType = trip.special_type ?? undefined;

    return {
      id,
      recordIds: [id],
      date: getClientDateKey(tripDate, clientTimezone),
      time: formatClientTime(tripDate, clientTimezone),
      mode: specialType ? 'special' : normalizeTripMode(rawType),
      specialType,
      rawType,
    };
  });

export function groupManualTripsByDate(
  serviceTrips: ServiceTrip[],
  clientTimezone?: string,
): Record<string, Trip[]> {
  const trips: Trip[] = [];
  const pendingByKey = new Map<string, CalendarTripCandidate[]>();

  toCalendarTripCandidates(serviceTrips, clientTimezone).forEach((candidate) => {
    if (candidate.mode === 'special' || candidate.mode === 'roundTrip') {
      trips.push(toTrip(candidate));
      return;
    }

    const key = `${candidate.date}|${candidate.time}`;
    const group = [...(pendingByKey.get(key) ?? []), candidate];

    if (
      group.length === 2 &&
      group.some((trip) => isOutboundType(trip.rawType)) &&
      group.some((trip) => isReturnType(trip.rawType))
    ) {
      trips.push({
        ...toTrip(group[0]),
        id: group.map((trip) => trip.id).join('+'),
        recordIds: group.flatMap((trip) => trip.recordIds),
        mode: 'roundTrip',
      });
      pendingByKey.delete(key);
      return;
    }

    pendingByKey.set(key, group);
  });

  pendingByKey.forEach((group) => {
    group.forEach((candidate) => trips.push(toTrip(candidate)));
  });

  return trips.reduce<Record<string, Trip[]>>((grouped, trip) => {
    grouped[trip.date] = [...(grouped[trip.date] ?? []), trip];
    return grouped;
  }, {});
}

export function useManualMonthTrips(
  clientId: string | null,
  monthDate: Date,
  clientTimezone?: string,
): ManualMonthTripsState {
  const [state, setState] = useState<ManualMonthTripsState>(EMPTY_STATE);

  const monthRange = useMemo(() => {
    const days = getClientMonthDays(monthDate, clientTimezone);
    return {
      from: days[0]?.dateKey ?? null,
      to: days[days.length - 1]?.dateKey ?? null,
    };
  }, [monthDate, clientTimezone]);

  useEffect(() => {
    if (!clientId || !monthRange.from || !monthRange.to) {
      setState(EMPTY_STATE);
      return;
    }

    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: null }));

    tripsService
      .getByDateRange(clientId, monthRange.from, monthRange.to)
      .then((serviceTrips) => {
        if (controller.signal.aborted) return;
        setState({
          tripsByDate: groupManualTripsByDate(serviceTrips, clientTimezone),
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState({
          tripsByDate: {},
          loading: false,
          error: getErrorMessage(error, 'Error cargando viajes del mes'),
        });
      });

    return () => controller.abort();
  }, [clientId, monthRange.from, monthRange.to, clientTimezone]);

  return state;
}
