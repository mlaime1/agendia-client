import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CalendarDay, Trip } from '../types';
import { CalendarDayCell } from './CalendarDayCell';

type CalendarGridProps = {
  days: CalendarDay[];
  leadingEmptyCells: number;
  tripsByDate: Record<string, Trip[]>;
  onDayPress: (dateKey: string) => void;
  onDayLongPress: (dateKey: string) => void;
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({
  days,
  leadingEmptyCells,
  tripsByDate,
  onDayPress,
  onDayLongPress,
}: CalendarGridProps) {
  const monthCells = [
    ...Array.from({ length: leadingEmptyCells }, (_, index) => ({
      id: `empty-${index}`,
      day: null,
    })),
    ...days.map((day) => ({
      id: day.dateKey,
      day,
    })),
  ];
  const trailingEmptyCells = (7 - (monthCells.length % 7)) % 7;
  const cells = [
    ...monthCells,
    ...Array.from({ length: trailingEmptyCells }, (_, index) => ({
      id: `trailing-empty-${index}`,
      day: null,
    })),
  ];
  const rows = Array.from({ length: Math.ceil(cells.length / 7) }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  );

  return (
    <View style={styles.container}>
      <View style={styles.weekHeader}>
        {weekdays.map((weekday) => (
          <Text key={weekday} style={styles.weekday}>
            {weekday}
          </Text>
        ))}
      </View>

      <View style={styles.rows}>
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell) =>
              cell.day ? (
                <CalendarDayCell
                  day={cell.day}
                  key={cell.id}
                  onLongPress={onDayLongPress}
                  onPress={onDayPress}
                  trips={tripsByDate[cell.day.dateKey] ?? []}
                />
              ) : (
                <View key={cell.id} style={styles.emptyCell} />
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  weekHeader: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    color: '#7B877F',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  rows: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  emptyCell: {
    aspectRatio: 1,
    flex: 1,
    minHeight: 50,
  },
});
