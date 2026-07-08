import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme';
import type { SummaryStatus } from '../../../services/types';
import { getSummaryStatusConfig } from '../utils/summaryStatus';

type SummaryStatusBadgeProps = {
  status: SummaryStatus;
  label?: string;
};

export function SummaryStatusBadge({ status, label }: SummaryStatusBadgeProps) {
  const { theme } = useTheme();
  const styles = useStyles();
  const config = getSummaryStatusConfig(status, theme);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.label, { color: config.text }]}>{label ?? config.label}</Text>
    </View>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
        badge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
        },
        dot: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },
        label: {
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.semibold,
        },
      }),
    [theme],
  );
};
