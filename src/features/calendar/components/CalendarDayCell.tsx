import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarDay, Trip } from '../types';
import { TripDots } from './TripDots';
import { Theme, useThemedStyles } from '../../../theme';

type CalendarDayCellProps = {
  day: CalendarDay;
  isAddModeActive?: boolean;
  isCurrentMonth?: boolean;
  trips: Trip[];
  onPress: (dateKey: string) => void;
  onLongPress: (dateKey: string) => void;
};

export function CalendarDayCell({
  day,
  isCurrentMonth = true,
  trips,
  onPress,
  onLongPress,
}: CalendarDayCellProps) {
  const styles = useThemedStyles(createStyles);

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

        <View style={styles.dotsContainer}>
          {trips.length > 0 ? <TripDots trips={trips} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    cell: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
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
    pressedCell: {
      opacity: 0.7,
    },
    dayContent: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    dayNumber: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0,
      lineHeight: 18,
    },
    todayText: {
      color: theme.colors.primary,
      fontWeight: '800',
    },
    outsideMonthText: {
      color: theme.colors.textSubtle,
    },
    dotsContainer: {
      minHeight: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
