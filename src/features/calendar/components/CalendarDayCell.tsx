import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarDay, Trip, TripMode } from '../types';
import { Theme, useTheme, useThemedStyles } from '../../../theme';

type CalendarDayCellProps = {
  day: CalendarDay;
  isAddModeActive?: boolean;
  isCurrentMonth?: boolean;
  trips: Trip[];
  onPress: (dateKey: string) => void;
  onLongPress: (dateKey: string) => void;
};

const tripModePriority: TripMode[] = ['special', 'roundTrip', 'outbound'];

const getTripDotColor = (mode: TripMode, theme: Theme) => {
  switch (mode) {
    case 'outbound':
      return theme.colors.trip.outbound.border;
    case 'roundTrip':
      return theme.colors.trip.roundTrip.border;
    case 'special':
      return theme.colors.trip.special.border;
    default:
      return theme.colors.textSubtle;
  }
};

export function CalendarDayCell({
  day,
  isAddModeActive = false,
  isCurrentMonth = true,
  trips,
  onPress,
  onLongPress,
}: CalendarDayCellProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const primaryTrip = trips.length > 0
    ? trips.find((trip) => tripModePriority.includes(trip.mode)) ?? trips[0]
    : null;

  return (
    <Pressable
      accessibilityLabel={`Día ${day.dayNumber}`}
      disabled={!isCurrentMonth}
      onLongPress={() => onLongPress(day.dateKey)}
      onPress={() => onPress(day.dateKey)}
      style={({ pressed }) => [
        styles.cell,
        !isCurrentMonth && styles.outsideMonthCell,
        day.isToday && styles.todayCell,
        isAddModeActive && isCurrentMonth && styles.addModeCell,
        pressed && styles.pressedCell,
      ]}
    >
      <View style={styles.dayContent}>
        <Text
          style={[
            styles.dayNumber,
            !isCurrentMonth && styles.outsideMonthText,
            day.isToday && styles.todayText,
          ]}
        >
          {day.dayNumber}
        </Text>

        {primaryTrip ? (
          <View
            style={[
              styles.tripDot,
              { backgroundColor: getTripDotColor(primaryTrip.mode, theme) },
            ]}
          />
        ) : (
          <View style={styles.tripDotPlaceholder} />
        )}
      </View>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    cell: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      backgroundColor: 'transparent',
    },
    todayCell: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    outsideMonthCell: {
      opacity: 0.45,
    },
    addModeCell: {
      backgroundColor: theme.colors.primaryLight,
    },
    pressedCell: {
      opacity: 0.7,
    },
    dayContent: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    dayNumber: {
      color: theme.colors.text,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0,
      lineHeight: 16,
    },
    todayText: {
      color: theme.colors.primary,
      fontWeight: '800',
    },
    outsideMonthText: {
      color: theme.colors.textSubtle,
    },
    tripDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    tripDotPlaceholder: {
      width: 5,
      height: 5,
    },
  });
