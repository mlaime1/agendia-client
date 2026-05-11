import { useMemo, useState } from 'react';

import { mockTrips } from '../data/mockTrips';
import { PendingSpecialTrip, Trip, TripMode, TripUpdates } from '../types';

const createTripId = () => `trip-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const getCurrentTime = () => {
  const now = new Date();

  return `${now.getHours().toString().padStart(2, '0')}:${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
};

export const useCalendarTrips = () => {
  const [trips, setTrips] = useState<Trip[]>(mockTrips);

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

  const addTrip = (dateKey: string, mode: TripMode) => {
    setTrips((currentTrips) => [
      ...currentTrips,
      {
        id: createTripId(),
        date: dateKey,
        time: getCurrentTime(),
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
        time: getCurrentTime(),
        mode: 'special',
        specialType: specialType.trim() || 'Ruta especial',
        note: note.trim() || undefined,
      },
    ]);
  };

  const updateTrip = (tripId: string, updates: TripUpdates) => {
    setTrips((currentTrips) =>
      currentTrips.map((trip) => (trip.id === tripId ? { ...trip, ...updates } : trip)),
    );
  };

  return {
    trips,
    tripsByDate,
    addTrip,
    addSpecialTrip,
    updateTrip,
  };
};
