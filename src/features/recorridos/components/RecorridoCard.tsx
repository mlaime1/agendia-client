import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { Theme, useThemedStyles } from '../../../theme';
import type { Itinerary } from '../../../services/types';

type RecorridoCardProps = {
  recorrido: Itinerary;
  onPress: (id: string) => void;
};

export function RecorridoCard({ recorrido, onPress }: RecorridoCardProps) {
  const styles = useThemedStyles(createStyles);
  const isActive = recorrido.is_active !== false;

  const stopCountText = recorrido.stops
    ? recorrido.stops.length === 1
      ? '1 parada'
      : `${recorrido.stops.length} paradas`
    : '—';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, !isActive && styles.cardInactive, pressed && styles.cardPressed]}
      onPress={() => onPress(recorrido.id)}
    >
      {!isActive && (
        <View style={styles.inactiveBadge}>
          <Text style={styles.inactiveBadgeText}>Inactivo</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <View style={styles.routeIcon}>
          <AppIcon name="map" size={20} color={styles.iconColor.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {recorrido.name}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {stopCountText}
          </Text>
        </View>
        <AppIcon name="chevronRight" size={18} color={styles.chevronColor.color} />
      </View>

      {recorrido.stops && recorrido.stops.length > 0 && (
        <View style={styles.stopsRow}>
          {recorrido.stops.slice(0, 2).map((stop, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === Math.min(recorrido.stops!.length - 1, 1);

            return (
              <React.Fragment key={stop.id}>
                <View style={styles.stopDot} />
                {!isLast && <View style={styles.stopLine} />}
                <Text style={styles.stopLabel} numberOfLines={1}>
                  {stop.address.split(',')[0]}
                </Text>
              </React.Fragment>
            );
          })}
          {recorrido.stops.length > 2 && (
            <View style={styles.stopsOverflow}>
              <Text style={styles.stopsOverflowText}>
                +{recorrido.stops.length - 2}
              </Text>
            </View>
          )}
        </View>
      )}

      {recorrido.rates && recorrido.rates.length > 0 && (
        <View style={styles.ratesRow}>
          {recorrido.rates.map((rate) => (
            <View key={rate.id} style={styles.rateChip}>
              <Text style={styles.rateType}>{rate.trip_type}</Text>
              <Text style={styles.ratePrice}>${rate.base_price}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.large,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    cardPressed: {
      opacity: 0.8,
    },
    cardInactive: {
      opacity: 0.75,
      backgroundColor: theme.colors.surfaceMuted,
    },
    inactiveBadge: {
      position: 'absolute',
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      backgroundColor: theme.colors.semantic.warning.bg,
      borderWidth: 1,
      borderColor: theme.colors.semantic.warning.border,
      borderRadius: theme.radii.small,
      paddingVertical: 2,
      paddingHorizontal: theme.spacing.sm,
      zIndex: 1,
    },
    inactiveBadgeText: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.semantic.warning.text,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
    },
    routeIcon: {
      width: 38,
      height: 38,
      borderRadius: theme.radii.medium,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    iconColor: {
      color: theme.colors.primary,
    },
    cardInfo: {
      flex: 1,
    },
    cardName: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.text,
    },
    cardMeta: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.textMuted,
      fontWeight: theme.typography.weight.medium,
      marginTop: 2,
    },
    chevronColor: {
      color: theme.colors.textSubtle,
    },
    stopsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      overflow: 'hidden',
    },
    stopDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      flexShrink: 0,
    },
    stopLine: {
      flex: 1,
      height: 1.5,
      backgroundColor: `${theme.colors.primary}50`,
      marginHorizontal: 2,
    },
    stopLabel: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.textMuted,
      fontWeight: theme.typography.weight.semibold,
      maxWidth: 90,
      textAlign: 'center',
      paddingHorizontal: theme.spacing.xs,
    },
    stopsOverflow: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 2,
    },
    stopsOverflowText: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.textMuted,
      fontWeight: theme.typography.weight.semibold,
    },
    ratesRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
      paddingTop: theme.spacing.md,
    },
    rateChip: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.small,
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
      gap: 2,
    },
    rateType: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    ratePrice: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.primary,
    },
  });
