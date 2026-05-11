import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarDay, Trip } from '../types';
import { TripStamp } from './TripStamp';

type CalendarDayCellProps = {
  day: CalendarDay;
  isCurrentMonth?: boolean;
  trips: Trip[];
  onPress: (dateKey: string) => void;
  onLongPress: (dateKey: string) => void;
};

const visibleStampCount = 3;

export function CalendarDayCell({
  day,
  isCurrentMonth = true,
  trips,
  onPress,
  onLongPress,
}: CalendarDayCellProps) {
  const visibleTrips = trips.slice(0, visibleStampCount);
  const hiddenTripCount = Math.max(trips.length - visibleStampCount, 0);

  return (
    <Pressable
      accessibilityLabel={`Day ${day.dayNumber}`}
      disabled={!isCurrentMonth}
      onLongPress={() => onLongPress(day.dateKey)}
      onPress={() => onPress(day.dateKey)}
      style={({ pressed }) => [
        styles.cell,
        !isCurrentMonth && styles.outsideMonthCell,
        day.isToday && styles.todayCell,
        trips.length > 0 && styles.hasTripsCell,
        pressed && styles.pressedCell,
      ]}
    >
      <Text
        style={[
          styles.dayNumber,
          !isCurrentMonth && styles.outsideMonthText,
          day.isToday && styles.todayText,
        ]}
      >
        {day.dayNumber}
      </Text>

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
    flex: 1,
    height: 92,
    position: 'relative',
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 5,
    borderWidth: 1,
    borderColor: '#E2E9E3',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  todayCell: {
    borderColor: '#2F8B57',
    borderWidth: 1.5,
  },
  hasTripsCell: {
    backgroundColor: '#FCFEFC',
  },
  outsideMonthCell: {
    borderColor: '#EDF2EE',
    backgroundColor: '#F7FAF7',
  },
  pressedCell: {
    transform: [{ scale: 0.97 }],
  },
  dayNumber: {
    color: '#526057',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 16,
  },
  todayText: {
    color: '#247145',
  },
  outsideMonthText: {
    color: '#AAB5AD',
  },
  stamps: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    gap: 3,
    marginTop: 8,
  },
  overflow: {
    position: 'absolute',
    top: 6,
    right: 5,
    color: '#8B6A27',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
