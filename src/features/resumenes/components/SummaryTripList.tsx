import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  if (trip.special_type) return `Especial (${trip.special_type})`;
  const tripType = trip.trip_type as string;
  if (tripType === 'ida_y_vuelta' || tripType === 'ida y vuelta') return 'Ida y vuelta';
  return trip.trip_type === 'ida' ? 'Ida' : trip.trip_type;
}

function getTripVisual(label: string): {
  icon: 'star-outline' | 'arrow-forward-outline' | 'swap-horizontal-outline';
  color: 'special' | 'outbound' | 'roundTrip';
  badge: string;
} {
  if (label.startsWith('Especial')) return { icon: 'star-outline', color: 'special', badge: 'Especial' };
  if (label === 'Ida y vuelta') return { icon: 'swap-horizontal-outline', color: 'roundTrip', badge: label };
  return { icon: 'arrow-forward-outline', color: 'outbound', badge: 'Ida' };
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
      <View style={styles.sectionHeader}>
        <Text style={styles.title}>Viajes incluidos</Text>
        <Text style={styles.count}>{groupedTrips.length} {groupedTrips.length === 1 ? 'día' : 'días'}</Text>
      </View>
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
              <Text style={styles.dayCount}>{item.tripCount} {item.tripCount === 1 ? 'viaje' : 'viajes'}</Text>
            </View>

            {item.groups.map((group, index) => (
              <View key={`${item.dateKey}-${group.label}`}>
                <View style={styles.tripRow}>
                  <View style={[styles.tripIcon, styles[getTripVisual(group.label).color]]}>
                    <Ionicons
                      name={getTripVisual(group.label).icon}
                      size={18}
                      color={styles[getTripVisual(group.label).color].color}
                    />
                  </View>
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripType} numberOfLines={1}>{group.label}</Text>
                    <Text style={styles.tripMeta}>
                      {group.totalTrips} {group.totalTrips === 1 ? 'viaje' : 'viajes'}
                      {permissions.can.payments ? ` · $${formatCurrency(group.totalAmount)}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.tripBadge, styles[getTripVisual(group.label).color]]}>
                    {getTripVisual(group.label).badge}
                  </Text>
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
          marginBottom: 0,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        count: {
          color: theme.colors.primary,
          backgroundColor: theme.colors.primaryLight,
          borderRadius: theme.radii.pill,
          paddingHorizontal: 9,
          paddingVertical: 3,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.semibold,
        },
        list: {
          gap: 14,
        },
        daySection: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.medium,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        },
        dayHeader: {
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 10,
        },
        dayTitle: {
          color: theme.colors.text,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.bold,
        },
        dayCount: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.semibold,
        },
        tripRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        tripIcon: {
          width: 38,
          height: 38,
          borderRadius: theme.radii.small,
          alignItems: 'center',
          justifyContent: 'center',
        },
        outbound: {
          color: theme.colors.trip.outbound.text,
          backgroundColor: theme.colors.trip.outbound.bg,
        },
        roundTrip: {
          color: theme.colors.trip.roundTrip.text,
          backgroundColor: theme.colors.trip.roundTrip.bg,
        },
        special: {
          color: theme.colors.trip.special.text,
          backgroundColor: theme.colors.trip.special.bg,
        },
        tripInfo: {
          flex: 1,
          minWidth: 0,
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
        tripBadge: {
          flexShrink: 0,
          borderRadius: theme.radii.small,
          paddingHorizontal: 9,
          paddingVertical: 4,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.bold,
        },
        tripPrice: {
          color: theme.colors.text,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.bold,
        },
        tripSeparator: {
          height: 1,
          backgroundColor: theme.colors.border,
          marginHorizontal: 16,
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
