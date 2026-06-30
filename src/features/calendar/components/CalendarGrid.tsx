import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CalendarDay, Trip } from '../types';
import { isSameDay, toDateKey } from '../utils/date';
import { CalendarDayCell } from './CalendarDayCell';
import { Theme, useThemedStyles } from '../../../theme';
import { getClientToday } from '../../../utils/dateTime';

type CalendarGridProps = {
  days: CalendarDay[];
  leadingEmptyCells: number;
  tripsByDate: Record<string, Trip[]>;
  onDayPress: (dateKey: string) => void;
  onDayLongPress: (dateKey: string) => void;
  clientTimezone?: string;
  isAddModeActive?: boolean;
};

const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type CalendarCell = {
  id: string;
  day: CalendarDay;
  isCurrentMonth: boolean;
};

export function CalendarGrid({
  days,
  leadingEmptyCells,
  tripsByDate,
  onDayPress,
  onDayLongPress,
  clientTimezone,
  isAddModeActive,
}: CalendarGridProps) {
  const styles = useThemedStyles(createStyles);
  const today = getClientToday(clientTimezone);
  const monthStart = days[0]?.date ?? today;
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();

  const createCalendarDay = (date: Date): CalendarDay => ({
    date,
    dateKey: toDateKey(date, clientTimezone),
    dayNumber: date.getDate(),
    isToday: isSameDay(date, today, clientTimezone),
  });

  const monthCells: CalendarCell[] = [
    ...Array.from({ length: leadingEmptyCells }, (_, index) => {
      const date = new Date(year, month, index - leadingEmptyCells + 1);

      return {
        id: `leading-${toDateKey(date, clientTimezone)}`,
        day: createCalendarDay(date),
        isCurrentMonth: false,
      };
    }),
    ...days.map((day) => ({
      id: day.dateKey,
      day,
      isCurrentMonth: true,
    })),
  ];
  const trailingEmptyCells = (7 - (monthCells.length % 7)) % 7;
  const cells = [
    ...monthCells,
    ...Array.from({ length: trailingEmptyCells }, (_, index) => {
      const date = new Date(year, month, days.length + index + 1);

      return {
        id: `trailing-${toDateKey(date, clientTimezone)}`,
        day: createCalendarDay(date),
        isCurrentMonth: false,
      };
    }),
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
            {row.map((cell) => (
              <CalendarDayCell
                day={cell.day}
                isAddModeActive={isAddModeActive}
                isCurrentMonth={cell.isCurrentMonth}
                key={cell.id}
                onLongPress={onDayLongPress}
                onPress={onDayPress}
                trips={cell.isCurrentMonth ? tripsByDate[cell.day.dateKey] ?? [] : []}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    gap: 7,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 1,
  },
  weekday: {
    flex: 1,
    color: theme.colors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  rows: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'stretch',
  },
});
