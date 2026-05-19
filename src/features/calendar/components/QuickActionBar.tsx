import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TripMode } from '../types';

type QuickAction = {
  label: string;
  mode: TripMode;
  colors: {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
  };
};

type QuickActionBarProps = {
  selectedMode: TripMode | null;
  onSelectMode: (mode: TripMode | null) => void;
};

const actions: QuickAction[] = [
  {
    label: 'Ida',
    mode: 'outbound',
    colors: {
      backgroundColor: '#EAF7EE',
      borderColor: '#65A878',
      textColor: '#247145',
    },
  },
  {
    label: 'Ida y vuelta',
    mode: 'roundTrip',
    colors: {
      backgroundColor: '#EAF2FF',
      borderColor: '#77A9E8',
      textColor: '#255EA8',
    },
  },
  {
    label: 'Especial',
    mode: 'special',
    colors: {
      backgroundColor: '#FFF0DA',
      borderColor: '#E7A85D',
      textColor: '#99510D',
    },
  },
];

export function QuickActionBar({ selectedMode, onSelectMode }: QuickActionBarProps) {
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
                backgroundColor: action.colors.backgroundColor,
                borderColor: action.colors.borderColor,
              },
              pressed && styles.pressedButton,
            ]}
          >
            <Text
              style={[
                styles.label,
                isSelected && { color: action.colors.textColor },
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

const styles = StyleSheet.create({
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
      backgroundColor: '#F7FAF7',
  },
  pressedButton: {
    opacity: 0.72,
  },
  label: {
      color: '#7A9E8A',
    fontSize: 13,
      fontWeight: '600',
    letterSpacing: 0,
  },
  selectedLabel: {
    fontWeight: '700',
  },
});
