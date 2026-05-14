import { mockTripRecords } from './mockTrips';
import { toCalendarTrip } from './tripMappers';
import { CreateTripPayload, Trip, TripRecord, TripUpdates } from '../types';
import { tripsService } from '../../../services';
import type { Trip as ServiceTrip } from '../../../services/types';

const createTripId = () => `trip-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeServiceTripDate = (tripDate: string) => tripDate.slice(0, 10);

const normalizeServiceTripType = (tripType: ServiceTrip['trip_type']): TripRecord['trip_type'] => {
  if (tripType === 'ida' || tripType === 'outbound') {
    return 'outbound';
  }

  if (tripType === 'vuelta' || tripType === 'return') {
    return 'return';
  }

  if (tripType === 'ida y vuelta' || tripType === 'ida_y_vuelta' || tripType === 'roundTrip') {
    return 'roundTrip';
  }

  return 'special';
};

let tripRecords: TripRecord[] = [...mockTripRecords];

const createTripRecord = (payload: CreateTripPayload, userId: string): TripRecord => ({
  id: createTripId(),
  user_id: userId,
  client_id: payload.client_id,
  route_id: payload.route_id,
  rate_id: payload.rate_id,
  summary_id: null,
  trip_date: payload.trip_date,
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

const mapServiceTripToRecord = (s: ServiceTrip): TripRecord => ({
  id: s.id,
  user_id: s.user_id,
  client_id: s.client_id,
  route_id: s.route_id,
  rate_id: s.rate_id,
  summary_id: s.summary_id ?? null,
  trip_date: normalizeServiceTripDate(s.trip_date),
  trip_time: s.created_at ? new Date(s.created_at).toTimeString().slice(0, 5) : '08:00',
  trip_type: normalizeServiceTripType(s.trip_type),
  final_price: Number(s.final_price) || 0,
  has_surcharge: s.has_surcharge,
  surcharge_reason: s.surcharge_reason ?? null,
  special_type: s.special_type ?? null,
  notes: s.notes ?? null,
  created_at: s.created_at,
});

const groupRecordsForCalendar = (records: TripRecord[]) => {
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
        trips.push(toCalendarTrip(groupedRecords));
        pendingRoundTrips.delete(roundTripKey);
        return;
      }

      pendingRoundTrips.set(roundTripKey, groupedRecords);
      return;
    }

    trips.push(toCalendarTrip([record]));
  });

  pendingRoundTrips.forEach((records) => {
    records.forEach((record) => trips.push(toCalendarTrip([record])));
  });

  return trips.sort((left, right) => left.date.localeCompare(right.date) || left.time.localeCompare(right.time));
};

export const tripRepository = {
  // Intenta cargar desde el API; lanza si falla
  listCalendarTrips: async (clientId?: string): Promise<Trip[]> => {
    const serviceTrips = await tripsService.getAll();
    let records = serviceTrips.map(mapServiceTripToRecord);
    tripRecords = records.length ? records : tripRecords;

    if (clientId) {
      records = records.filter((r) => r.client_id === clientId);
    }

    return groupRecordsForCalendar(records.length ? records : (clientId ? tripRecords.filter(r => r.client_id === clientId) : tripRecords));
  },

  // Local-only list (fallback)
  getLocalCalendarTrips: (clientId?: string): Trip[] =>
    groupRecordsForCalendar(clientId ? tripRecords.filter((r) => r.client_id === clientId) : tripRecords),

  // Intenta crear en API; lanza si falla
  createTrips: async (payloads: CreateTripPayload[], userId: string): Promise<Trip> => {
    const created: ServiceTrip[] = await Promise.all(
      payloads.map((p) => {
        const body: any = {
          user_id: userId,
          client_id: p.client_id,
          route_id: p.route_id,
          rate_id: null,
          trip_date: p.trip_date,
          trip_type: p.trip_type,
          final_price: 0,
        };

        // Agregar campos opcionales solo si existen
        if (p.trip_time) body.trip_time = p.trip_time;
        if (p.special_type) body.special_type = p.special_type;
        if (p.notes) body.notes = p.notes;

        console.log('[tripRepository] createTrips body:', body);

        return tripsService.create(body);
      }),
    );

    console.log('[tripRepository] createTrips response:', created);

    const records = created.map(mapServiceTripToRecord);
    tripRecords = [...tripRecords, ...records];
    return toCalendarTrip(records);
  },

  // Local fallback create (no API)
  createLocalTrips: (payloads: CreateTripPayload[], userId: string): Trip => {
    const records = payloads.map((p) => createTripRecord(p, userId));
    tripRecords = [...tripRecords, ...records];
    return toCalendarTrip(records);
  },

  // Intenta actualizar en API; lanza si falla
  updateCalendarTrip: async (trip: Trip, updates: TripUpdates): Promise<void> => {
    await Promise.all(
      trip.recordIds.map((id) => {
        const body: any = {};

        if (updates.specialType !== undefined) body.special_type = updates.specialType?.trim() || null;
        if (updates.note !== undefined) body.notes = updates.note ?? null;

        if (updates.mode === 'special') {
          body.trip_type = 'especial';
          body.special_type = updates.specialType?.trim() || 'Ruta especial';
        } else if (updates.mode === 'roundTrip') {
          body.trip_type = 'ida y vuelta';
        } else if (updates.mode === 'outbound') {
          body.trip_type = 'ida';
        }

        return tripsService.update(id, body);
      }),
    );

    const serviceTrips = await tripsService.getAll();
    tripRecords = serviceTrips.map(mapServiceTripToRecord);
  },

  // Intenta borrar en API; lanza si falla
  deleteCalendarTrip: async (trip: Trip): Promise<void> => {
    await Promise.all(trip.recordIds.map((id) => tripsService.remove(id)));

    const remainingServiceTrips = await tripsService.getAll();
    tripRecords = remainingServiceTrips.map(mapServiceTripToRecord);
  },

  // Local fallback update
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

  // Local fallback delete
  deleteLocalCalendarTrip: (trip: Trip): void => {
    tripRecords = tripRecords.filter((record) => !trip.recordIds.includes(record.id));
  },
};
