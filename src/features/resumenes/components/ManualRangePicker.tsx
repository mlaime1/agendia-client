import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme';
import { getLeadingEmptyCells, getMonthDays } from '../../calendar/utils/date';
import {
  getClientLongDateLabelFromDate,
  getClientMonthLabelFromDate,
  isSameDay,
} from '../../../utils/dateTime';

type ManualRangePickerProps = {
  monthDate: Date;
  startDate: Date | null;
  endDate: Date | null;
  clientTimezone?: string;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onClear: () => void;
};

export function ManualRangePicker({
  monthDate,
  startDate,
  endDate,
  clientTimezone,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onClear,
}: ManualRangePickerProps) {
  const styles = useStyles();
  const days = getMonthDays(monthDate, clientTimezone);
  const leadingEmptyCells = getLeadingEmptyCells(monthDate, clientTimezone);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.fieldLabel}>Rango manual</Text>
        <Pressable
          onPress={onClear}
          style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
        >
          <Text style={styles.clearButtonText}>Limpiar</Text>
        </Pressable>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
            onPress={onPrevMonth}
          >
            <Ionicons name="chevron-back" size={18} color={styles.iconColor.color} />
          </Pressable>
          <Text style={styles.monthLabel}>{getClientMonthLabelFromDate(monthDate, clientTimezone)}</Text>
          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
            onPress={onNextMonth}
          >
            <Ionicons name="chevron-forward" size={18} color={styles.iconColor.color} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((label, index) => (
            <Text key={`weekday-${index}`} style={styles.weekLabel}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {Array.from({ length: leadingEmptyCells }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.cellPlaceholder} />
          ))}

          {days.map((day) => {
            const isStart = startDate ? isSameDay(day.date, startDate, clientTimezone) : false;
            const isEnd = endDate ? isSameDay(day.date, endDate, clientTimezone) : false;
            const isInRange = startDate && endDate ? isDateInRange(day.date, startDate, endDate) : false;

            return (
              <Pressable
                key={day.dateKey}
                style={({ pressed }) => [
                  styles.cell,
                  isInRange && styles.cellInRange,
                  (isStart || isEnd) && styles.cellSelected,
                  day.isToday && styles.cellToday,
                  pressed && styles.cellPressed,
                ]}
                onPress={() => onSelectDate(day.date)}
              >
                <Text
                  style={[
                    styles.cellText,
                    (isStart || isEnd) && styles.cellTextSelected,
                  ]}
                >
                  {day.dayNumber}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.rangeSummary}>
        <RangeSummaryItem
          label="Desde"
          date={startDate}
          clientTimezone={clientTimezone}
        />
        <RangeSummaryItem
          label="Hasta"
          date={endDate}
          clientTimezone={clientTimezone}
        />
      </View>
    </View>
  );
}

type RangeSummaryItemProps = {
  label: string;
  date: Date | null;
  clientTimezone?: string;
};

function RangeSummaryItem({ label, date, clientTimezone }: RangeSummaryItemProps) {
  const styles = useStyles();
  return (
    <View style={styles.rangeSummaryItem}>
      <Text style={styles.rangeSummaryLabel}>{label}</Text>
      <Text style={styles.rangeSummaryValue}>
        {date ? getClientLongDateLabelFromDate(date, clientTimezone) : 'Seleccionar fecha'}
      </Text>
    </View>
  );
}

function isDateInRange(date: Date, start: Date, end: Date) {
  const currentTime = date.getTime();
  return currentTime >= start.getTime() && currentTime <= end.getTime();
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: 12,
          marginBottom: 16,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        fieldLabel: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.bold,
          textTransform: 'uppercase',
        },
        clearButton: {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.surfaceMuted,
        },
        clearButtonPressed: {
          opacity: 0.8,
        },
        clearButtonText: {
          color: theme.colors.primary,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.bold,
        },
        calendarCard: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          backgroundColor: theme.colors.surface,
          padding: 12,
        },
        calendarHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        navButton: {
          width: 34,
          height: 34,
          borderRadius: theme.radii.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.surfaceMuted,
        },
        navButtonPressed: {
          opacity: 0.8,
        },
        iconColor: {
          color: theme.colors.text,
        },
        monthLabel: {
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.heavy,
          textTransform: 'capitalize',
        },
        weekRow: {
          flexDirection: 'row',
          marginBottom: 8,
        },
        weekLabel: {
          flex: 1,
          textAlign: 'center',
          color: theme.colors.textMuted,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.heavy,
        },
        calendarGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
        cellPlaceholder: {
          width: '14.2857%',
          aspectRatio: 1,
        },
        cell: {
          width: '14.2857%',
          aspectRatio: 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme.radii.small,
        },
        cellPressed: {
          opacity: 0.85,
        },
        cellToday: {
          borderWidth: 1,
          borderColor: theme.colors.semantic.success.border,
        },
        cellInRange: {
          backgroundColor: theme.colors.primaryLight,
        },
        cellSelected: {
          backgroundColor: theme.colors.primary,
        },
        cellText: {
          color: theme.colors.text,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.bold,
        },
        cellTextSelected: {
          color: theme.colors.textInverse,
        },
        rangeSummary: {
          flexDirection: 'row',
          gap: 10,
        },
        rangeSummaryItem: {
          flex: 1,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          backgroundColor: theme.colors.surfaceSubtle,
          padding: 10,
        },
        rangeSummaryLabel: {
          color: theme.colors.textMuted,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.bold,
          textTransform: 'uppercase',
          marginBottom: 4,
        },
        rangeSummaryValue: {
          color: theme.colors.text,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.bold,
        },
      }),
    [theme],
  );
};
