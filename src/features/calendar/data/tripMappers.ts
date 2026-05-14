import { CreateCalendarTripInput, CreateTripPayload, Trip, TripRecord } from '../types';

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

export const toCreateTripPayloads = ({
  dateKey,
  mode,
  specialType,
  note,
  clientId = '3',
  routeId = '3',
}: CreateCalendarTripInput & { clientId?: string; routeId?: string; rateId?: string }): CreateTripPayload[] => {
  const basePayload = {
    client_id: clientId,
    route_id: routeId,
    rate_id: null,
    trip_date: dateKey,
    trip_time: getCurrentTime(),
    notes: note?.trim() || null,
  };

  if (mode === 'roundTrip') {
    return [{ ...basePayload, trip_type: 'ida y vuelta', special_type: null }];
  }

  return [
    {
      ...basePayload,
      trip_type: mode === 'special' ? 'especial' : 'ida',
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
  const isSingleRoundTrip = firstRecord.trip_type === 'roundTrip';
  const isSpecial = firstRecord.trip_type === 'special';

  return {
    id: records.map((record) => record.id).join('+'),
    recordIds: records.map((record) => record.id),
    date: firstRecord.trip_date,
    time: firstRecord.trip_time,
    mode: isRoundTrip || isSingleRoundTrip ? 'roundTrip' : isSpecial ? 'special' : 'outbound',
    specialType,
    note: firstRecord.notes ?? undefined,
  };
};
