import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { Theme, useThemedStyles } from '../../../theme';
import type { ItineraryStop } from '../../../services/types';

type StopTimelineProps = {
  stops: ItineraryStop[];
};

export function StopTimeline({ stops }: StopTimelineProps) {
  const styles = useThemedStyles(createStyles);

  const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);

  return (
    <View style={styles.timeline}>
      {sortedStops.map((stop, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === sortedStops.length - 1;
        const isMid = !isFirst && !isLast;

        return (
          <View key={stop.id} style={styles.stopItem}>
            <View style={styles.stopAside}>
              {isFirst || isLast ? (
                <View style={styles.stopNode} />
              ) : (
                <View style={styles.stopNodeMid} />
              )}
              {!isLast && <View style={styles.stopConnector} />}
            </View>
            <View style={styles.stopBody}>
              <Text style={styles.stopName}>{stop.address.split(',')[0]}</Text>
              <Text style={styles.stopAddr}>{stop.address}</Text>
              {(isFirst || isLast) && (
                <View style={styles.stopBadge}>
                  <AppIcon
                    name={isFirst ? 'map' : 'check'}
                    size={11}
                    color={styles.badgeIcon.color}
                  />
                  <Text style={styles.stopBadgeText}>{isFirst ? 'Origen' : 'Destino'}</Text>
                </View>
              )}
              {isMid && (
                <Text style={styles.stopOrder}>Parada {stop.stop_order}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    timeline: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    stopItem: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    stopAside: {
      alignItems: 'center',
      width: 20,
      flexShrink: 0,
    },
    stopNode: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.colors.primary,
      marginTop: 3,
    },
    stopNodeMid: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      marginTop: 5,
    },
    stopConnector: {
      width: 2,
      flex: 1,
      backgroundColor: `${theme.colors.primary}50`,
      minHeight: 28,
      marginVertical: 3,
    },
    stopBody: {
      flex: 1,
      paddingBottom: theme.spacing.md,
    },
    stopName: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.text,
    },
    stopAddr: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    stopBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.small,
      paddingVertical: 3,
      paddingHorizontal: theme.spacing.xs,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: `${theme.colors.primary}40`,
    },
    badgeIcon: {
      color: theme.colors.primary,
    },
    stopBadgeText: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.primary,
    },
    stopOrder: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.textSubtle,
      fontWeight: theme.typography.weight.semibold,
      marginTop: 2,
    },
  });
