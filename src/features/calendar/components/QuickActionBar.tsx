import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TripMode } from '../types';
import { Theme, useTheme, useThemedStyles } from '../../../theme';

type QuickAction = {
  label: string;
  mode: TripMode;
  disabled?: boolean;
};

type QuickActionBarProps = {
  selectedMode: TripMode | null;
  onSelectMode: (mode: TripMode | null) => void;
  readOnly?: boolean;
};

const actions: QuickAction[] = [
  {
    label: 'Ida',
    mode: 'outbound',
  },
  {
    label: 'Ida y vuelta',
    mode: 'roundTrip',
  },
  {
    label: 'Especial',
    mode: 'special',
  },
];

export function QuickActionBar({ selectedMode, onSelectMode, readOnly = false }: QuickActionBarProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const displayActions = actions.map((action) => ({
    ...action,
    disabled: readOnly && action.mode !== 'special',
  }));

  return (
    <View style={styles.container}>
      {displayActions.map((action) => {
        const isSelected = action.mode === selectedMode;
        const isDisabled = action.disabled;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled: isDisabled }}
            disabled={isDisabled}
            key={action.mode}
            onPress={() => onSelectMode(isSelected ? null : action.mode)}
            style={({ pressed }) => [
              styles.button,
              isDisabled && styles.disabledButton,
              isSelected && !isDisabled && {
                backgroundColor: theme.colors.trip[action.mode].bg,
                borderColor: theme.colors.trip[action.mode].border,
              },
              pressed && !isDisabled && styles.pressedButton,
            ]}
          >
            <Text
              style={[
                styles.label,
                isDisabled && styles.disabledLabel,
                isSelected && !isDisabled && { color: theme.colors.trip[action.mode].text },
                isSelected && !isDisabled && styles.selectedLabel,
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 18,
  },
  button: {
    flex: 1,
      minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
      paddingVertical: 9,
      paddingHorizontal: 0,
      borderWidth: 1,
      borderColor: 'transparent',
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceMuted,
  },
  pressedButton: {
    opacity: 0.72,
  },
  disabledButton: {
    opacity: 0.4,
  },
  label: {
    color: theme.colors.textSubtle,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
  },
  disabledLabel: {
    color: theme.colors.textSubtle,
    opacity: 0.5,
  },
  selectedLabel: {
    fontWeight: '700',
  },
});
