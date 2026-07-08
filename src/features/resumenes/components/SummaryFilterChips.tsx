import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../theme';
import type { SummaryStatus } from '../../../services/types';
import { getSummaryStatusConfig } from '../utils/summaryStatus';

type SummaryFilter = 'all' | SummaryStatus;

type FilterOption = {
  value: SummaryFilter;
  label: string;
};

type SummaryFilterChipsProps = {
  options: FilterOption[];
  activeFilter: SummaryFilter;
  onSelect: (filter: SummaryFilter) => void;
};

export function SummaryFilterChips({ options, activeFilter, onSelect }: SummaryFilterChipsProps) {
  const styles = useStyles();
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const isActive = activeFilter === option.value;
        const dotColor =
          option.value === 'all'
            ? theme.colors.primary
            : getSummaryStatusConfig(option.value, theme).text;
        const activeBg =
          option.value === 'all'
            ? theme.colors.primaryLight
            : getSummaryStatusConfig(option.value, theme).bg;

        return (
          <Pressable
            key={option.value}
            style={[
              styles.chip,
              isActive && { backgroundColor: activeBg, borderColor: dotColor },
            ]}
            onPress={() => onSelect(option.value)}
          >
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <Text style={[styles.label, isActive && { color: dotColor }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: 8,
          paddingHorizontal: 2,
          paddingVertical: 2,
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 13,
          paddingVertical: 8,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        dot: {
          width: 6,
          height: 6,
          borderRadius: 3,
        },
        label: {
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.semibold,
          color: theme.colors.textMuted,
        },
      }),
    [theme],
  );
};
