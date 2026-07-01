import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Theme } from '../theme';
import { useThemedStyles } from '../theme/useThemedStyles';

export type RadioOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type RadioGroupProps<T extends string> = {
  options: RadioOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
};

export function RadioGroup<T extends string>({ options, selectedValue, onSelect }: RadioGroupProps<T>) {
  const styles = useThemedStyles(createStyles);

  const handleSelect = useCallback(
    (value: T) => () => onSelect(value),
    [onSelect],
  );

  return (
    <View style={styles.group}>
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <Pressable
            key={option.value}
            style={({ pressed }) => [
              styles.option,
              isSelected && styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
            onPress={handleSelect(option.value)}
          >
            <View style={styles.row}>
              <View style={[styles.circle, isSelected && styles.circleSelected]}>
                {isSelected ? <View style={styles.dot} /> : null}
              </View>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
            </View>
            {option.description ? (
              <Text style={[styles.description, isSelected && styles.descriptionSelected]}>
                {option.description}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    group: {
      paddingHorizontal: 18,
      paddingBottom: 14,
      gap: 8,
    },
    option: {
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.small,
      backgroundColor: theme.colors.background,
      paddingVertical: 11,
      paddingHorizontal: 14,
      gap: 4,
    },
    optionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
    },
    optionPressed: {
      opacity: 0.9,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    circle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: theme.colors.disabled,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.colors.primaryLight,
    },
    label: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.medium,
      color: theme.colors.textMuted,
    },
    labelSelected: {
      color: theme.colors.primary,
      fontWeight: theme.typography.weight.semibold,
    },
    description: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.textSubtle,
      marginLeft: 30,
    },
    descriptionSelected: {
      color: theme.colors.textMuted,
    },
  });
