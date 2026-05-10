import { useMemo, useState } from 'react';

import { mockTrips } from '../data/mockTrips';
import { PendingSpecialTrip, Trip, TripMode } from '../types';

const createTripId = () => `trip-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const useCalendarTrips = () => {
  const [trips, setTrips] = useState<Trip[]>(mockTrips);

  const tripsByDate = useMemo(
    () =>
      trips.reduce<Record<string, Trip[]>>((groupedTrips, trip) => {
        groupedTrips[trip.date] = [...(groupedTrips[trip.date] ?? []), trip];
        return groupedTrips;
      }, {}),
    [trips],
  );

  const addTrip = (dateKey: string, mode: TripMode) => {
    setTrips((currentTrips) => [
      ...currentTrips,
      {
        id: createTripId(),
        date: dateKey,
        mode,
      },
    ]);
  };

  const addSpecialTrip = ({ dateKey, specialType, note }: PendingSpecialTrip) => {
    setTrips((currentTrips) => [
      ...currentTrips,
      {
        id: createTripId(),
        date: dateKey,
        mode: 'special',
        specialType: specialType.trim() || 'Special route',
        note: note.trim() || undefined,
      },
    ]);
  };

  return {
    trips,
    tripsByDate,
    addTrip,
    addSpecialTrip,
  };
};
