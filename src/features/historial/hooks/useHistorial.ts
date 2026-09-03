import { useCallback, useEffect, useMemo, useState } from 'react';
import { addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { itinerariesService } from '../../../services/itineraries';
import { tripsService } from '../../../services/trips';
import type { ItineraryStop, Trip as ServiceTrip } from '../../../services/types';
import {
  formatClientDayHeader,
  formatClientTime,
  getClientToday,
  getClientTimezone,
} from '../../../utils/dateTime';

export type HistorialTripType = 'ida' | 'vta' | 'esp';

export type PaymentStatus = 'pending' | 'partial' | 'paid';

export type HistorialTrip = {
  id: string;
  type: HistorialTripType;
  time: string;
  origin: string | null;
  dest: string | null;
  label: string | null;
  price: number;
  pay: PaymentStatus;
  note: string | null;
};

export type HistorialDayGroup = {
  dayKey: string;
  dayTitle: string;
  trips: HistorialTrip[];
};

type WeekBounds = {
  start: Date;
  end: Date;
  from: string;
  to: string;
  label: string;
};

function getWeekBounds(referenceDate: Date, clientTimezone: string): WeekBounds {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
  const from = formatInTimeZone(start, clientTimezone, 'yyyy-MM-dd');
  const to = formatInTimeZone(end, clientTimezone, 'yyyy-MM-dd');
  const label = `${formatInTimeZone(start, clientTimezone, 'dd MMM')} — ${formatInTimeZone(end, clientTimezone, 'dd MMM')}`;

  return { start, end, from, to, label };
}

function normalizeTripType(tripType: ServiceTrip['trip_type']): HistorialTripType {
  const value = String(tripType ?? '')
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (value === 'ida_y_vuelta' || value === 'round_trip' || value === 'idayvuelta') {
    return 'vta';
  }

  if (value === 'especial' || value === 'special') {
    return 'esp';
  }

  if (value === 'ida' || value === 'outbound' || value === 'ida_') {
    return 'ida';
  }

  if (value === 'vuelta' || value === 'return' || value === 'vuelta_') {
    return 'ida';
  }

  return 'ida';
}

function normalizePaymentStatus(status?: ServiceTrip['payment_status'] | null): PaymentStatus {
  const value = String(status ?? '').toLowerCase();

  if (value === 'paid') return 'paid';
  if (value === 'partial') return 'partial';
  return 'pending';
}

function getItineraryEndpoints(
  trip: ServiceTrip,
  stopsByRouteId: Map<string, ItineraryStop[]>,
): { origin: string | null; dest: string | null } {
  const stops = stopsByRouteId.get(trip.route_id) ?? [];

  if (stops.length === 0) {
    return { origin: null, dest: null };
  }

  const sorted = [...stops].sort((a, b) => (a.stop_order ?? 0) - (b.stop_order ?? 0));
  return {
    origin: sorted[0]?.address ?? null,
    dest: sorted[sorted.length - 1]?.address ?? null,
  };
}

function resolveTripPrice(trip: ServiceTrip): number {
  const finalPrice = parseFloat(trip.final_price ?? '0');

  if (!Number.isNaN(finalPrice) && finalPrice > 0) {
    return finalPrice;
  }

  const basePrice = parseFloat(trip.rates?.base_price ?? '0');
  if (!Number.isNaN(basePrice) && basePrice > 0) {
    return basePrice;
  }

  return 0;
}

function mapTrip(
  trip: ServiceTrip,
  clientTimezone: string,
  stopsByRouteId: Map<string, ItineraryStop[]>,
): HistorialTrip {
  const type = normalizeTripType(trip.trip_type);
  const { origin, dest } = getItineraryEndpoints(trip, stopsByRouteId);

  return {
    id: trip.id,
    type,
    time: formatClientTime(trip.trip_date, clientTimezone),
    origin: type === 'esp' ? null : origin,
    dest: type === 'esp' ? null : dest,
    label: type === 'esp' ? (trip.special_type ?? 'Viaje especial') : null,
    price: resolveTripPrice(trip),
    pay: normalizePaymentStatus(trip.payment_status),
    note: trip.notes ?? null,
  };
}

async function loadStopsForTrips(trips: ServiceTrip[]): Promise<Map<string, ItineraryStop[]>> {
  const routeIds = Array.from(
    new Set(trips.map((trip) => trip.route_id).filter(Boolean)),
  );

  const results = await Promise.all(
    routeIds.map(async (routeId) => {
      try {
        const itinerary = await itinerariesService.getById(routeId);

        if (itinerary.stops && itinerary.stops.length > 0) {
          return { routeId, stops: itinerary.stops };
        }

        const stops = await itinerariesService.getStops(routeId);
        return { routeId, stops };
      } catch {
        try {
          const stops = await itinerariesService.getStops(routeId);
          return { routeId, stops };
        } catch {
          return { routeId, stops: [] as ItineraryStop[] };
        }
      }
    }),
  );

  const map = new Map<string, ItineraryStop[]>();
  results.forEach(({ routeId, stops }) => {
    map.set(routeId, stops);
  });

  return map;
}

export type UseHistorialResult = {
  groups: HistorialDayGroup[];
  totalCount: number;
  totalAmount: number;
  loading: boolean;
  error: string | null;
  weekLabel: string;
  canGoForward: boolean;
  previousWeek: () => void;
  nextWeek: () => void;
  refetch: () => void;
};

export function useHistorial(
  selectedClientId: string | undefined,
  clientTimezoneOverride?: string,
): UseHistorialResult {
  const clientTimezone = clientTimezoneOverride ?? getClientTimezone();
  const [referenceDate, setReferenceDate] = useState<Date>(() => getClientToday(clientTimezone));
  const [trips, setTrips] = useState<ServiceTrip[]>([]);
  const [stopsByRouteId, setStopsByRouteId] = useState<Map<string, ItineraryStop[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bounds = useMemo(
    () => getWeekBounds(referenceDate, clientTimezone),
    [referenceDate, clientTimezone],
  );

  const fetchTrips = useCallback(async () => {
    if (!selectedClientId) {
      setTrips([]);
      setStopsByRouteId(new Map());
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await tripsService.getByDateRange(selectedClientId, bounds.from, bounds.to);
      const stopsMap = await loadStopsForTrips(data);

      setStopsByRouteId(stopsMap);
      setTrips(data);
    } catch (err) {
      setTrips([]);
      setStopsByRouteId(new Map());
      setError(err instanceof Error ? err.message : 'Error cargando viajes');
    } finally {
      setLoading(false);
    }
  }, [selectedClientId, bounds.from, bounds.to]);

  useEffect(() => {
    void fetchTrips();
  }, [fetchTrips]);

  const groups = useMemo(() => {
    const grouped = trips.reduce<Record<string, HistorialDayGroup>>((acc, trip) => {
      const dayKey = formatInTimeZone(trip.trip_date, clientTimezone, 'yyyy-MM-dd');
      const dayTitle = formatClientDayHeader(trip.trip_date, clientTimezone);

      if (!acc[dayKey]) {
        acc[dayKey] = { dayKey, dayTitle, trips: [] };
      }

      acc[dayKey].trips.push(mapTrip(trip, clientTimezone, stopsByRouteId));
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  }, [trips, clientTimezone, stopsByRouteId]);

  const { totalCount, totalAmount } = useMemo(
    () =>
      groups.reduce(
        (acc, group) => {
          group.trips.forEach((trip) => {
            acc.totalCount += 1;
            acc.totalAmount += trip.price;
          });
          return acc;
        },
        { totalCount: 0, totalAmount: 0 },
      ),
    [groups],
  );

  const today = useMemo(() => getClientToday(clientTimezone), [clientTimezone]);
  const canGoForward = bounds.start < startOfWeek(today, { weekStartsOn: 1 });

  const previousWeek = useCallback(() => {
    setReferenceDate((current) => addWeeks(current, -1));
  }, []);

  const nextWeek = useCallback(() => {
    setReferenceDate((current) => addWeeks(current, 1));
  }, []);

  return {
    groups,
    totalCount,
    totalAmount,
    loading,
    error,
    weekLabel: bounds.label,
    canGoForward,
    previousWeek,
    nextWeek,
    refetch: fetchTrips,
  };
}
