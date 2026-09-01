import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme';
import type { Trip } from '../../../services/types';
import {
  formatClientDayHeader,
  getClientDateKey,
} from '../../../utils/dateTime';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuth } from '../../../state/AuthContext';
import { usePermissions } from '../../../permissions';

type TripGroup = {
  label: string;
  trips: Trip[];
  totalAmount: number;
  totalTrips: number;
};

type DayGroup = {
  dateKey: string;
  groups: TripGroup[];
  subtotal: number;
  tripCount: number;
};

type SummaryTripListProps = {
  trips: Trip[];
  clientTimezone?: string;
};

function formatTripTypeLabel(trip: Trip) {
  return trip.special_type ? `Especial (${trip.special_type})` : trip.trip_type;
}

function groupTrips(trips: Trip[], clientTimezone?: string): DayGroup[] {
  const dayMap = new Map<string, Map<string, TripGroup>>();

  trips.forEach((trip) => {
    const dateKey = getClientDateKey(trip.trip_date, clientTimezone);
    const groupLabel = formatTripTypeLabel(trip);
    const dayGroups = dayMap.get(dateKey) ?? new Map<string, TripGroup>();
    const currentGroup = dayGroups.get(groupLabel) ?? {
      label: groupLabel,
      trips: [],
      totalAmount: 0,
      totalTrips: 0,
    };

    currentGroup.trips.push(trip);
    currentGroup.totalAmount += parseFloat(trip.final_price);
    currentGroup.totalTrips += 1;
    dayGroups.set(groupLabel, currentGroup);
    dayMap.set(dateKey, dayGroups);
  });

  return [...dayMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, groups]) => {
      const orderedGroups = [...groups.values()];
      const subtotal = orderedGroups.reduce((acc, group) => acc + group.totalAmount, 0);
      const tripCount = orderedGroups.reduce((acc, group) => acc + group.totalTrips, 0);

      return {
        dateKey,
        groups: orderedGroups,
        subtotal,
        tripCount,
      };
    });
}

export function SummaryTripList({ trips, clientTimezone }: SummaryTripListProps) {
  const styles = useStyles();
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const groupedTrips = React.useMemo(
    () => groupTrips(trips, clientTimezone),
    [trips, clientTimezone],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Viajes incluidos</Text>
      <FlatList
        data={groupedTrips}
        keyExtractor={(item) => item.dateKey}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay viajes en este resumen</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.daySection}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>
                {formatClientDayHeader(item.dateKey, clientTimezone)}
              </Text>
              {permissions.can.payments && (
                <Text style={styles.daySubtotal}>
                  Subtotal: ${formatCurrency(item.subtotal)}
                </Text>
              )}
            </View>

            {item.groups.map((group, index) => (
              <View key={`${item.dateKey}-${group.label}`}>
                <View style={styles.tripRow}>
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripType}>{group.label}</Text>
                    <Text style={styles.tripMeta}>
                      {group.totalTrips} {group.totalTrips === 1 ? 'viaje' : 'viajes'}
                    </Text>
                  </View>
                  {permissions.can.payments && (
                    <Text style={styles.tripPrice}>${formatCurrency(group.totalAmount)}</Text>
                  )}
                </View>
                {index < item.groups.length - 1 && <View style={styles.tripSeparator} />}
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingHorizontal: 16,
        },
        title: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.bold,
          textTransform: 'uppercase',
          marginBottom: 12,
        },
        list: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.medium,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        },
        daySection: {
          paddingVertical: 8,
        },
        dayHeader: {
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: theme.colors.surfaceSubtle,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        dayTitle: {
          color: theme.colors.text,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.bold,
        },
        daySubtotal: {
          color: theme.colors.primary,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.bold,
        },
        tripRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        tripInfo: {
          flex: 1,
        },
        tripType: {
          color: theme.colors.text,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.semibold,
        },
        tripMeta: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          marginTop: 2,
        },
        tripPrice: {
          color: theme.colors.text,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.bold,
        },
        tripSeparator: {
          height: 1,
          backgroundColor: theme.colors.border,
          marginHorizontal: 14,
        },
        emptyText: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.md,
          textAlign: 'center',
          paddingVertical: 24,
        },
      }),
    [theme],
  );
};
