import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme, useTheme, useThemedStyles } from '../../../theme';
import type { UserRole } from '../../../features/auth/types/user';
import { useHistorial, HistorialTrip } from '../hooks/useHistorial';
import { formatCurrency } from '../../resumenes/utils/formatCurrency';

type HistorialScreenProps = {
  selectedClientId: string;
  role?: UserRole;
  onMenuPress: () => void;
};

type TypeFilter = 'all' | 'ida' | 'vta' | 'esp';

const FILTER_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'ida', label: 'Ida' },
  { value: 'vta', label: 'Ida y vuelta' },
  { value: 'esp', label: 'Especial' },
];

const TYPE_LABELS: Record<HistorialTrip['type'], string> = {
  ida: 'Ida',
  vta: 'Ida y vuelta',
  esp: 'Especial',
};

const PAY_LABELS: Record<HistorialTrip['pay'], string> = {
  paid: 'Pagado',
  partial: 'Parcial',
  pending: 'Pendiente',
};

const getBadgeColors = (theme: Theme) => ({
  ida: {
    background: theme.colors.trip.outbound.bg,
    text: theme.colors.trip.outbound.text,
  },
  vta: {
    background: theme.colors.trip.roundTrip.bg,
    text: theme.colors.trip.roundTrip.text,
  },
  esp: {
    background: theme.colors.trip.special.bg,
    text: theme.colors.trip.special.text,
  },
});

const getPayColors = (theme: Theme) => ({
  paid: {
    dot: theme.colors.semantic.success.text,
    text: theme.colors.semantic.success.text,
  },
  partial: {
    dot: theme.colors.semantic.warning.border,
    text: theme.colors.semantic.warning.text,
  },
  pending: {
    dot: theme.colors.textSubtle,
    text: theme.colors.textSubtle,
  },
});

export function HistorialScreen({
  selectedClientId,
  role = 'driver',
  onMenuPress,
}: HistorialScreenProps) {
  const isClientView = role === 'client';
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [filter, setFilter] = useState<TypeFilter>('all');
  const {
    groups,
    totalCount,
    totalAmount,
    loading,
    error,
    weekLabel,
    canGoForward,
    previousWeek,
    nextWeek,
    refetch,
  } = useHistorial(selectedClientId);

  const filteredGroups = useMemo(() => {
    if (filter === 'all') return groups;

    return groups
      .map((group) => ({
        ...group,
        trips: group.trips.filter((trip) => trip.type === filter),
      }))
      .filter((group) => group.trips.length > 0);
  }, [groups, filter]);

  const visibleTotalAmount = useMemo(
    () =>
      filteredGroups.reduce((acc, group) => acc + group.trips.reduce((sum, trip) => sum + trip.price, 0), 0),
    [filteredGroups],
  );

  const visibleTotalCount = useMemo(
    () => filteredGroups.reduce((acc, group) => acc + group.trips.length, 0),
    [filteredGroups],
  );

  const badgeColors = useMemo(() => getBadgeColors(theme), [theme]);
  const payColors = useMemo(() => getPayColors(theme), [theme]);

  const renderTripCard = (trip: HistorialTrip) => {
    const badge = badgeColors[trip.type];
    const pay = payColors[trip.pay];

    return (
      <View key={trip.id} style={styles.tripCard}>
        <View style={styles.tripTop}>
          <View style={styles.tripTypeTime}>
            <View style={[styles.typeBadge, { backgroundColor: badge.background }]}>
              <Text style={[styles.typeBadgeText, { color: badge.text }]}>{TYPE_LABELS[trip.type]}</Text>
            </View>
            <Text style={styles.tripTime}>{trip.time} hs</Text>
          </View>
          {!isClientView && <Text style={styles.tripPrice}>${formatCurrency(trip.price)}</Text>}
          {isClientView && trip.type !== 'esp' && <Text style={styles.hiddenPrice}>—</Text>}
        </View>

        {trip.type === 'esp' ? (
          <View style={styles.routeLine}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.routeDotOrigin]} />
              <Text style={styles.routeText}>{trip.label}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.routeLine}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.routeDotOrigin]} />
              <Text style={styles.routeText}>{trip.origin ?? 'Origen no disponible'}</Text>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.routeDotDest]} />
              <Text style={styles.routeText}>{trip.dest ?? 'Destino no disponible'}</Text>
            </View>
          </View>
        )}

        {trip.note ? (
          <View style={styles.noteContainer}>
            <Text style={styles.tripNote}>"{trip.note}"</Text>
          </View>
        ) : null}

        {!isClientView ? (
          <View style={styles.tripFooter}>
            <View style={styles.payStatus}>
              <View style={[styles.payDot, { backgroundColor: pay.dot }]} />
              <Text style={[styles.payText, { color: pay.text }]}>{PAY_LABELS[trip.pay]}</Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }

    if (filteredGroups.length === 0) {
      return (
        <View style={styles.emptyState}>
          <AppIcon name="calendar" size={28} color={theme.colors.textSubtle} />
          <Text style={styles.emptyText}>Sin viajes en este período</Text>
        </View>
      );
    }

    return (
      <>
        {filteredGroups.map((group) => (
          <View key={group.dayKey} style={styles.dayGroup}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{group.dayTitle}</Text>
              {!isClientView && (
                <Text style={styles.dayTotal}>
                  ${formatCurrency(group.trips.reduce((sum, trip) => sum + trip.price, 0))}
                </Text>
              )}
            </View>
            {group.trips.map(renderTripCard)}
          </View>
        ))}
      </>
    );
  };

  return (
    <ScreenWrapper title="Historial de viajes" onMenuPress={onMenuPress}>
      <View style={styles.container}>
        {/* Period bar */}
        <View style={styles.periodBar}>
          <Pressable
            style={({ pressed }) => [styles.periodArrow, pressed && styles.periodArrowPressed]}
            onPress={previousWeek}
            accessibilityLabel="Semana anterior"
          >
            <AppIcon name="chevronLeft" size={18} color={theme.colors.primary} />
          </Pressable>

          <View style={styles.periodPill}>
            <AppIcon name="calendar" size={15} color={theme.colors.primary} />
            <Text style={styles.periodLabel}>{weekLabel}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.periodArrow,
              !canGoForward && styles.periodArrowDisabled,
              pressed && canGoForward && styles.periodArrowPressed,
            ]}
            onPress={nextWeek}
            disabled={!canGoForward}
            accessibilityLabel="Semana siguiente"
          >
            <AppIcon
              name="chevronRight"
              size={18}
              color={canGoForward ? theme.colors.primary : theme.colors.disabled}
            />
          </Pressable>
        </View>

        {/* Type filters */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeFilterRow}
          >
            {FILTER_OPTIONS.map((option) => {
              const isActive = filter === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.typePill, isActive && styles.typePillActive]}
                  onPress={() => setFilter(option.value)}
                >
                  <Text style={[styles.typePillText, isActive && styles.typePillTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Summary strip */}
        <View style={styles.summaryStrip}>
          <Text style={styles.summaryCount}>
            {visibleTotalCount} viaje{visibleTotalCount !== 1 ? 's' : ''}
          </Text>
          {!isClientView && (
            <Text style={styles.summaryTotal}>${formatCurrency(visibleTotalAmount)}</Text>
          )}
        </View>

        {/* Trips list */}
        <ScrollView
          contentContainerStyle={styles.scrollArea}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    periodBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    periodArrow: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    periodArrowPressed: {
      backgroundColor: theme.colors.surfaceMuted,
    },
    periodArrowDisabled: {
      opacity: 0.45,
    },
    periodPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: `${theme.colors.primary}40`,
      backgroundColor: theme.colors.primaryLight,
    },
    periodLabel: {
      color: theme.colors.primary,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
    },
    filterSection: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingVertical: 12,
    },
    typeFilterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      minHeight: 44,
    },
    typePill: {
      flexShrink: 0,
      paddingHorizontal: 18,
      paddingVertical: 10,
      minHeight: 40,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceMuted,
    },
    typePillActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    typePillText: {
      color: theme.colors.text,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
    },
    typePillTextActive: {
      color: theme.colors.textInverse,
    },
    summaryStrip: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
    },
    summaryCount: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.textMuted,
    },
    summaryTotal: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.primary,
    },
    scrollArea: {
      flexGrow: 1,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 16,
    },
    dayGroup: {
      marginBottom: 12,
    },
    dayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: 4,
      paddingTop: 6,
      paddingBottom: 8,
    },
    dayTitle: {
      fontSize: theme.typography.size.sm,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.text,
      textTransform: 'capitalize',
    },
    dayTotal: {
      fontSize: theme.typography.size.sm,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.primary,
    },
    tripCard: {
      backgroundColor: theme.colors.surface,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.medium,
      padding: 14,
      marginBottom: 8,
    },
    tripTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 8,
      gap: 8,
    },
    tripTypeTime: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    typeBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.radii.pill,
    },
    typeBadgeText: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.semibold,
    },
    tripTime: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.textSubtle,
    },
    tripPrice: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.text,
    },
    hiddenPrice: {
      fontSize: theme.typography.size.sm,
      fontWeight: theme.typography.weight.regular,
      color: theme.colors.textSubtle,
    },
    routeLine: {
      marginBottom: 8,
    },
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    routeDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    routeDotOrigin: {
      backgroundColor: theme.colors.trip.outbound.border,
    },
    routeDotDest: {
      backgroundColor: '#D85A30',
    },
    routeConnector: {
      width: 1,
      height: 12,
      backgroundColor: theme.colors.borderStrong,
      marginLeft: 3,
      marginVertical: 2,
    },
    routeText: {
      flex: 1,
      fontSize: 12.5,
      color: theme.colors.text,
      lineHeight: 17,
    },
    tripFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    payStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    payDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    payText: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.semibold,
    },
    noteContainer: {
      width: '100%',
      marginBottom: 8,
    },
    tripNote: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.textSubtle,
      fontStyle: 'italic',
      lineHeight: 18,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      gap: 8,
    },
    emptyText: {
      fontSize: theme.typography.size.md,
      color: theme.colors.textSubtle,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: theme.typography.size.md,
      textAlign: 'center',
      marginBottom: 12,
    },
    retryButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.small,
    },
    retryButtonText: {
      color: theme.colors.textInverse,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
    },
  });
