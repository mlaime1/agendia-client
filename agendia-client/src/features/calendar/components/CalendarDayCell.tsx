import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarDay, Trip } from '../types';
import { TripStamp } from './TripStamp';

type CalendarDayCellProps = {
  day: CalendarDay;
  trips: Trip[];
  onPress: (dateKey: string) => void;
  onLongPress: (dateKey: string) => void;
};

const visibleStampCount = 3;

export function CalendarDayCell({ day, trips, onPress, onLongPress }: CalendarDayCellProps) {
  const visibleTrips = trips.slice(0, visibleStampCount);
  const hiddenTripCount = Math.max(trips.length - visibleStampCount, 0);

  return (
    <Pressable
      accessibilityLabel={`Day ${day.dayNumber}`}
      onLongPress={() => onLongPress(day.dateKey)}
      onPress={() => onPress(day.dateKey)}
      style={({ pressed }) => [
        styles.cell,
        day.isToday && styles.todayCell,
        trips.length > 0 && styles.hasTripsCell,
        pressed && styles.pressedCell,
      ]}
    >
      <Text style={[styles.dayNumber, day.isToday && styles.todayText]}>{day.dayNumber}</Text>

      <View style={styles.stamps}>
        {visibleTrips.map((trip) => (
          <TripStamp key={trip.id} mode={trip.mode} />
        ))}
      </View>

      {hiddenTripCount > 0 ? <Text style={styles.overflow}>+{hiddenTripCount}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    aspectRatio: 1,
    flex: 1,
    minHeight: 50,
    padding: 5,
    borderWidth: 1,
    borderColor: '#E8EFE9',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  todayCell: {
    borderColor: '#7BB88E',
  },
  hasTripsCell: {
    backgroundColor: '#FBFDFB',
  },
  pressedCell: {
    transform: [{ scale: 0.97 }],
  },
  dayNumber: {
    color: '#526057',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
  },
  todayText: {
    color: '#247145',
  },
  stamps: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  overflow: {
    alignSelf: 'flex-end',
    color: '#8B6A27',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
