import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarDay, Trip, TripMode } from '../types';
import { isSameDay, toDateKey } from '../utils/date';
import { CalendarDayCell } from './CalendarDayCell';
import { Theme, useTheme, useThemedStyles } from '../../../theme';
import { getClientToday } from '../../../utils/dateTime';

const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const legendItems: { label: string; mode: TripMode }[] = [
  { label: 'Ida', mode: 'outbound' },
  { label: 'Vuelta', mode: 'roundTrip' },
  { label: 'Especial', mode: 'special' },
];

type CalendarCell = {
  id: string;
  day: CalendarDay;
  isCurrentMonth: boolean;
};

type CalendarGridProps = {
  availableHeight: number;
  days: CalendarDay[];
  leadingEmptyCells: number;
  tripsByDate: Record<string, Trip[]>;
  onDayPress: (dateKey: string) => void;
  onDayLongPress: (dateKey: string) => void;
  clientTimezone?: string;
  isAddModeActive?: boolean;
};

const GRID_HORIZONTAL_PADDING = 10;
const WEEK_HEADER_HEIGHT = 28;
const LEGEND_BASE_HEIGHT = 44;
const CONTAINER_GAP = 10;
const ROW_GAP = 4;
const MAX_CELL_RATIO = 0.9;
const MIN_CELL_RATIO = 0.6;

export function CalendarGrid({
  availableHeight,
  days,
  leadingEmptyCells,
  tripsByDate,
  onDayPress,
  onDayLongPress,
  clientTimezone,
  isAddModeActive,
}: CalendarGridProps) {
  const { theme } = useTheme();
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

  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const gridWidth = windowWidth - GRID_HORIZONTAL_PADDING * 2;
  const cellWidth = gridWidth / 7;
  const numRows = rows.length;
  const legendHeight = LEGEND_BASE_HEIGHT + insets.bottom;
  const availableRowsHeight =
    availableHeight - WEEK_HEADER_HEIGHT - legendHeight - CONTAINER_GAP - (numRows - 1) * ROW_GAP;
  const maxCellHeight = cellWidth * MAX_CELL_RATIO;
  const minCellHeight = cellWidth * MIN_CELL_RATIO;
  const cellHeight = Math.min(
    maxCellHeight,
    Math.max(minCellHeight, availableRowsHeight / numRows),
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
                cellHeight={cellHeight}
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

      <View style={[styles.legend, { paddingBottom: insets.bottom + 12 }]}>
        {legendItems.map((item) => (
          <View key={item.mode} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.trip[item.mode].border },
              ]}
            />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

  const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      gap: CONTAINER_GAP,
      paddingTop: 8,
    },
    weekHeader: {
      flexDirection: 'row',
      paddingHorizontal: 1,
    },
    weekday: {
      flex: 1,
      color: theme.colors.textSubtle,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0,
      textAlign: 'center',
    },
    rows: {
      gap: ROW_GAP,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendLabel: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0,
    },
  });
