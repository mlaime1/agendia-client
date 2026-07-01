import { CreateCalendarTripInput, CreateTripPayload, Trip, TripRecord } from '../types';

const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

export const toCreateTripPayloads = ({
  dateKey,
  mode,
  specialType,
  note,
  price,
  clientId,
  routeId,
  rateId,
}: CreateCalendarTripInput & { clientId: string; routeId?: string | null; rateId?: string | null }): CreateTripPayload[] => {
  if (!clientId) {
    throw new Error('Falta el cliente para crear el viaje.');
  }

  const tripTime = getCurrentTime();
  const tripDate = `${dateKey}T${tripTime}:00`;

  if (mode === 'special') {
    return [
      {
        client_id: clientId,
        trip_date: tripDate,
        trip_time: tripTime,
        trip_type: 'especial',
        special_type: specialType?.trim() || 'Ruta especial',
        notes: note?.trim() || null,
        price,
      },
    ];
  }

  if (!routeId) {
    throw new Error('Falta la ruta para crear el viaje.');
  }

  const basePayload = {
    client_id: clientId,
    route_id: routeId,
    rate_id: rateId,
    trip_date: tripDate,
    trip_time: tripTime,
    notes: note?.trim() || null,
  };

  if (mode === 'roundTrip') {
    return [{ ...basePayload, trip_type: 'ida y vuelta', special_type: null }];
  }

  return [{ ...basePayload, trip_type: 'ida', special_type: null }];
};

export const toCalendarTrip = (records: TripRecord[], _clientTimezone?: string): Trip => {
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
    routeId: firstRecord.route_id || undefined,
    specialType,
    note: firstRecord.notes ?? undefined,
    finalPrice: firstRecord.final_price,
  };
};
