import { useMemo, useState } from 'react';

import { toCreateTripPayloads } from '../data/tripMappers';
import { tripRepository } from '../data/tripRepository';
import { PendingSpecialTrip, Trip, TripMode, TripUpdates } from '../types';

export const useCalendarTrips = () => {
  const [trips, setTrips] = useState<Trip[]>(() => tripRepository.listCalendarTrips());

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
    const trip = tripRepository.createTrips(toCreateTripPayloads({ dateKey, mode }));
    setTrips(tripRepository.listCalendarTrips());

    return trip;
  };

  const addSpecialTrip = ({ dateKey, specialType, note }: PendingSpecialTrip) => {
    const trip = tripRepository.createTrips(
      toCreateTripPayloads({ dateKey, mode: 'special', specialType, note }),
    );
    setTrips(tripRepository.listCalendarTrips());

    return trip;
  };

  const updateTrip = (tripId: string, updates: TripUpdates) => {
    const trip = trips.find((currentTrip) => currentTrip.id === tripId);

    if (!trip) {
      return;
    }

    tripRepository.updateCalendarTrip(trip, updates);
    setTrips(tripRepository.listCalendarTrips());
  };

  return {
    trips,
    tripsByDate,
    addTrip,
    addSpecialTrip,
    updateTrip,
  };
};
