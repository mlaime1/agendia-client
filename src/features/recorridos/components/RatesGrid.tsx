import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Theme, useThemedStyles } from '../../../theme';
import type { ItineraryRate } from '../../../services/types';

type RatesGridProps = {
  rates: ItineraryRate[];
};

export function RatesGrid({ rates }: RatesGridProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.ratesGrid}>
      {rates.map((rate) => (
        <View key={rate.id} style={styles.rateCard}>
          <Text style={styles.rateType}>{rate.trip_type}</Text>
          <Text style={styles.ratePrice}>${rate.base_price}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    ratesGrid: {
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    rateCard: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.medium,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    rateType: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    ratePrice: {
      fontSize: theme.typography.size.lg,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.primary,
    },
  });
