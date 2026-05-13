import { mockTripRecords } from './mockTrips';
import { toCalendarTrip } from './tripMappers';
import { CreateTripPayload, Trip, TripRecord, TripUpdates } from '../types';

const createTripId = () => `trip-${Date.now()}-${Math.random().toString(16).slice(2)}`;

let tripRecords = [...mockTripRecords];

const createTripRecord = (payload: CreateTripPayload): TripRecord => ({
  id: createTripId(),
  user_id: 'demo-user',
  client_id: payload.client_id,
  route_id: payload.route_id,
  rate_id: 'demo-rate',
  summary_id: null,
  trip_date: payload.trip_date,
  trip_time: payload.trip_time,
  trip_type: payload.trip_type,
  final_price: 0,
  has_surcharge: false,
  surcharge_reason: null,
  special_type: payload.special_type ?? null,
  notes: payload.notes ?? null,
  created_at: new Date().toISOString(),
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
  listCalendarTrips: () => groupRecordsForCalendar(tripRecords),

  createTrips: (payloads: CreateTripPayload[]) => {
    const records = payloads.map(createTripRecord);
    tripRecords = [...tripRecords, ...records];

    return toCalendarTrip(records);
  },

  updateCalendarTrip: (trip: Trip, updates: TripUpdates) => {
    tripRecords = tripRecords.map((record) => {
      if (!trip.recordIds.includes(record.id)) {
        return record;
      }

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
};
