import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Trip, TripMode } from '../types';
import { Theme, useTheme, useThemedStyles } from '../../../theme';

const tripModeOrder: TripMode[] = ['outbound', 'roundTrip', 'special'];

const sortTripsByMode = (trips: Trip[]): Trip[] => {
  return [...trips].sort((left, right) => {
    const leftIndex = tripModeOrder.indexOf(left.mode);
    const rightIndex = tripModeOrder.indexOf(right.mode);

    return leftIndex - rightIndex;
  });
};

const getDotColor = (mode: TripMode, theme: Theme): string => {
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

type TripDotsProps = {
  trips: Trip[];
};

export function TripDots({ trips }: TripDotsProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const sortedTrips = sortTripsByMode(trips);
  const visibleTrips = sortedTrips.slice(0, 3);
  const hasOverflow = trips.length > 3;

  return (
    <View style={styles.container}>
      {visibleTrips.map((trip, index) => (
        <View
          key={`${trip.id}-${index}`}
          style={[styles.dot, { backgroundColor: getDotColor(trip.mode, theme) }]}
        />
      ))}
      {hasOverflow ? <Text style={styles.overflow}>+</Text> : null}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      minHeight: 8,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    overflow: {
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: '800',
      lineHeight: 10,
      marginLeft: 1,
    },
  });
