import { CreateCalendarTripInput, CreateTripPayload, Trip, TripRecord } from '../types';

const DEFAULT_CLIENT_ID = 'demo-client';
const DEFAULT_ROUTE_ID = 'demo-route';

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

export const toCreateTripPayloads = ({
  dateKey,
  mode,
  specialType,
  note,
}: CreateCalendarTripInput): CreateTripPayload[] => {
  const basePayload = {
    client_id: DEFAULT_CLIENT_ID,
    route_id: DEFAULT_ROUTE_ID,
    trip_date: dateKey,
    trip_time: getCurrentTime(),
    notes: note?.trim() || null,
  };

  if (mode === 'roundTrip') {
    return [
      { ...basePayload, trip_type: 'outbound', special_type: null },
      { ...basePayload, trip_type: 'return', special_type: null },
    ];
  }

  return [
    {
      ...basePayload,
      trip_type: 'outbound',
      special_type: mode === 'special' ? specialType?.trim() || 'Ruta especial' : null,
    },
  ];
};

export const toCalendarTrip = (records: TripRecord[]): Trip => {
  const firstRecord = records[0];
  const isRoundTrip =
    records.length === 2 &&
    records.some((record) => record.trip_type === 'outbound') &&
    records.some((record) => record.trip_type === 'return');
  const specialType = firstRecord.special_type ?? undefined;

  return {
    id: records.map((record) => record.id).join('+'),
    recordIds: records.map((record) => record.id),
    date: firstRecord.trip_date,
    time: firstRecord.trip_time,
    mode: isRoundTrip ? 'roundTrip' : specialType ? 'special' : 'outbound',
    specialType,
    note: firstRecord.notes ?? undefined,
  };
};
