import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TripMode } from '../types';
import { Theme, useTheme, useThemedStyles } from '../../../theme';

type QuickAction = {
  label: string;
  mode: TripMode;
};

type QuickActionBarProps = {
  selectedMode: TripMode | null;
  onSelectMode: (mode: TripMode | null) => void;
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

export function QuickActionBar({ selectedMode, onSelectMode }: QuickActionBarProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {actions.map((action) => {
        const isSelected = action.mode === selectedMode;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={action.mode}
            onPress={() => onSelectMode(isSelected ? null : action.mode)}
            style={({ pressed }) => [
              styles.button,
              isSelected && {
                backgroundColor: theme.colors.trip[action.mode].bg,
                borderColor: theme.colors.trip[action.mode].border,
              },
              pressed && styles.pressedButton,
            ]}
          >
            <Text
              style={[
                styles.label,
                isSelected && { color: theme.colors.trip[action.mode].text },
                isSelected && styles.selectedLabel,
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
  label: {
      color: theme.colors.textSubtle,
    fontSize: 13,
      fontWeight: '600',
    letterSpacing: 0,
  },
  selectedLabel: {
    fontWeight: '700',
  },
});
