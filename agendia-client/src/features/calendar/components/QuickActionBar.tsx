import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TripMode } from '../types';

type QuickAction = {
  label: string;
  mode: TripMode;
};

type QuickActionBarProps = {
  selectedMode: TripMode;
  onSelectMode: (mode: TripMode) => void;
};

const actions: QuickAction[] = [
  { label: 'Ida', mode: 'outbound' },
  { label: 'Ida y vuelta', mode: 'roundTrip' },
  { label: 'Especial', mode: 'special' },
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
            onPress={() => onSelectMode(action.mode)}
            style={({ pressed }) => [
              styles.button,
              isSelected && styles.selectedButton,
              pressed && styles.pressedButton,
            ]}
          >
            <Text style={[styles.label, isSelected && styles.selectedLabel]}>{action.label}</Text>
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
  selectedButton: {
    borderColor: '#65A878',
    backgroundColor: '#EAF7EE',
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
  selectedLabel: {
    color: '#247145',
  },
});
