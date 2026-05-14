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
            <Text style={[styles.label, isSelected && { color: action.colors.textColor }]}>
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
    marginTop: 18,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7E2D8',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  pressedButton: {
    opacity: 0.72,
  },
  label: {
    color: '#58665B',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
