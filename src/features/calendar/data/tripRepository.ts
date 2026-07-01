import { toCalendarTrip } from './tripMappers';
import { CreateTripPayload, Trip, TripRecord, TripUpdates } from '../types';
import { tripsService } from '../../../services';
import { itinerariesService } from '../../../services/itineraries';
import type { Trip as ServiceTrip } from '../../../services/types';
import { getClientDateKey, formatClientTime } from '../../../utils/dateTime';

const createTripId = () => `trip-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeServiceTripDate = (tripDate: string, clientTimezone?: string) =>
  getClientDateKey(tripDate, clientTimezone);

const normalizeLocalTripDate = (tripDate: string) => tripDate.slice(0, 10);

const normalizeServiceTripType = (tripType: ServiceTrip['trip_type']): TripRecord['trip_type'] => {
  const normalizedTripType = String(tripType);

  if (normalizedTripType === 'ida' || normalizedTripType === 'outbound') {
    return 'outbound';
  }

  if (normalizedTripType === 'vuelta' || normalizedTripType === 'return') {
    return 'return';
  }

  if (
    normalizedTripType === 'ida y vuelta' ||
    normalizedTripType === 'ida_y_vuelta' ||
    normalizedTripType === 'roundTrip'
  ) {
    return 'roundTrip';
  }

  return 'special';
};

let tripRecords: TripRecord[] = [];

const createTripRecord = (payload: CreateTripPayload, userId: string): TripRecord => ({
  id: createTripId(),
  user_id: userId,
  client_id: payload.client_id,
  route_id: payload.route_id ?? '',
  rate_id: payload.rate_id ?? null,
  summary_id: null,
  trip_date: normalizeLocalTripDate(payload.trip_date),
  trip_time: payload.trip_time,
  trip_type:
    payload.trip_type === 'ida y vuelta'
      ? 'roundTrip'
      : payload.trip_type === 'especial'
        ? 'special'
        : 'outbound',
  final_price: 0,
  has_surcharge: false,
  surcharge_reason: null,
  special_type: payload.special_type ?? null,
  notes: payload.notes ?? null,
  created_at: new Date().toISOString(),
});

const mapServiceTripToRecord = (s: ServiceTrip, clientTimezone?: string): TripRecord => {
  const safeTripDate = s.trip_date || new Date().toISOString();

  return {
    id: s.id ?? '',
    user_id: s.user_id ?? '',
    client_id: s.client_id ?? '',
    route_id: s.route_id ?? '',
    rate_id: s.rate_id ?? null,
    summary_id: s.summary_id ?? null,
    trip_date: normalizeServiceTripDate(safeTripDate, clientTimezone),
    trip_time: formatClientTime(safeTripDate, clientTimezone),
    trip_type: normalizeServiceTripType(s.trip_type),
    final_price: Number(s.final_price) || 0,
    has_surcharge: s.has_surcharge ?? false,
    surcharge_reason: s.surcharge_reason ?? null,
    special_type: s.special_type ?? null,
    notes: s.notes ?? null,
    created_at: s.created_at || new Date().toISOString(),
  };
};

const groupRecordsForCalendar = (records: TripRecord[], clientTimezone?: string) => {
  const trips: Trip[] = [];
  const pendingRoundTrips = new Map<string, TripRecord[]>();

  records.forEach((record) => {
    const roundTripKey = `${record.trip_date}-${record.trip_time}`;

    if (!record.special_type) {
      const groupedRecords = [...(pendingRoundTrips.get(roundTripKey) ?? []), record];

      if (
        groupedRecords.length === 2 &&
        groupedRecords.some((item) => item.trip_type === 'outbound') &&
        groupedRecords.some((item) => item.trip_type === 'return')
      ) {
        trips.push(toCalendarTrip(groupedRecords, clientTimezone));
        pendingRoundTrips.delete(roundTripKey);
        return;
      }

      pendingRoundTrips.set(roundTripKey, groupedRecords);
      return;
    }

    trips.push(toCalendarTrip([record], clientTimezone));
  });

  pendingRoundTrips.forEach((records) => {
    records.forEach((record) => trips.push(toCalendarTrip([record], clientTimezone)));
  });

  return trips.sort((left, right) => left.date.localeCompare(right.date) || left.time.localeCompare(right.time));
};

export const tripRepository = {
  listCalendarTrips: async (clientId?: string, clientTimezone?: string): Promise<Trip[]> => {
    const serviceTrips = clientId
      ? await tripsService.getByClient(clientId)
      : await tripsService.getAll();
    let records = serviceTrips.map((s) => mapServiceTripToRecord(s, clientTimezone));
    tripRecords = records.length ? records : tripRecords;

    if (clientId) {
      records = records.filter((r) => r.client_id === clientId);
    }

    return groupRecordsForCalendar(
      records.length ? records : clientId ? tripRecords.filter((r) => r.client_id === clientId) : tripRecords,
      clientTimezone,
    );
  },

  getLocalCalendarTrips: (clientId?: string, clientTimezone?: string): Trip[] =>
    groupRecordsForCalendar(
      clientId ? tripRecords.filter((r) => r.client_id === clientId) : tripRecords,
      clientTimezone,
    ),

  createTrips: async (payloads: CreateTripPayload[], userId: string, clientTimezone?: string): Promise<Trip> => {
    const created: ServiceTrip[] = await Promise.all(
      payloads.map((p) => {
        const body: any = {
          user_id: userId,
          client_id: p.client_id,
          trip_date: p.trip_date,
          trip_type: p.trip_type,
        };

        if (p.route_id) body.route_id = p.route_id;
        if (p.rate_id) body.rate_id = p.rate_id;
        if (p.trip_time) body.trip_time = p.trip_time;
        if (p.special_type) body.special_type = p.special_type;
        if (p.notes) body.notes = p.notes;

        if (p.trip_type === 'especial' && p.price) {
          const manualPrice = parseFloat(p.price);
          if (!Number.isNaN(manualPrice)) {
            body.final_price = manualPrice;
          }
        }

        return tripsService.create(body);
      }),
    );

    const records = created.map((s) => mapServiceTripToRecord(s, clientTimezone));
    tripRecords = [...tripRecords, ...records];
    return toCalendarTrip(records, clientTimezone);
  },

  createLocalTrips: (payloads: CreateTripPayload[], userId: string, clientTimezone?: string): Trip => {
    const records = payloads.map((p) => createTripRecord(p, userId));
    tripRecords = [...tripRecords, ...records];
    return toCalendarTrip(records, clientTimezone);
  },

  updateCalendarTrip: async (trip: Trip, updates: TripUpdates, clientTimezone?: string): Promise<void> => {
    const record = tripRecords.find((r) => r.id === trip.recordIds[0]);
    const currentRouteId = record?.route_id || updates.routeId || '';

    let rateId: string | null = null;

    if (updates.mode && updates.mode !== 'special') {
      if (!currentRouteId) {
        throw new Error('Falta la ruta para cambiar el viaje a regular.');
      }

      const tripType = updates.mode === 'roundTrip' ? 'ida_y_vuelta' : 'ida';
      const rates = await itinerariesService.getRates(currentRouteId);
      rateId = rates.find((rate) => rate.trip_type === tripType)?.id ?? null;

      if (!rateId) {
        throw new Error('No hay tarifa configurada para este tipo de viaje.');
      }
    }

    await Promise.all(
      trip.recordIds.map((id) => {
        const body: any = {};

        if (updates.specialType !== undefined) body.special_type = updates.specialType?.trim() || null;
        if (updates.note !== undefined) body.notes = updates.note ?? null;
        if (updates.time !== undefined) body.trip_date = `${trip.date}T${updates.time}:00`;

        if (updates.mode === 'special') {
          body.trip_type = 'especial';
          body.special_type = updates.specialType?.trim() || 'Ruta especial';
          body.route_id = null;
          body.rate_id = null;
        } else if (updates.mode === 'roundTrip') {
          body.trip_type = 'ida y vuelta';
          body.special_type = null;
          body.route_id = currentRouteId;
          if (rateId) body.rate_id = rateId;
        } else if (updates.mode === 'outbound') {
          body.trip_type = 'ida';
          body.special_type = null;
          body.route_id = currentRouteId;
          if (rateId) body.rate_id = rateId;
        }

        return tripsService.update(id, body);
      }),
    );

    const serviceTrips = await tripsService.getAll();
    tripRecords = serviceTrips.map((s) => mapServiceTripToRecord(s, clientTimezone));
  },

  deleteCalendarTrip: async (trip: Trip, clientTimezone?: string): Promise<void> => {
    await Promise.all(trip.recordIds.map((id) => tripsService.remove(id)));

    const remainingServiceTrips = await tripsService.getAll();
    tripRecords = remainingServiceTrips.map((s) => mapServiceTripToRecord(s, clientTimezone));
  },

  updateLocalCalendarTrip: (trip: Trip, updates: TripUpdates): void => {
    tripRecords = tripRecords.map((record) => {
      if (!trip.recordIds.includes(record.id)) return record;

      return {
        ...record,
        trip_time: updates.time ?? record.trip_time,
        special_type:
          updates.mode === 'special'
            ? updates.specialType?.trim() || record.special_type || 'Ruta especial'
            : updates.mode
            ? null
            : updates.specialType ?? record.special_type,
        notes: updates.note ?? record.notes,
      };
    });
  },

  deleteLocalCalendarTrip: (trip: Trip): void => {
    tripRecords = tripRecords.filter((record) => !trip.recordIds.includes(record.id));
  },
};
