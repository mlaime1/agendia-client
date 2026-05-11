import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TripMode } from '../types';

type TripStampProps = {
  mode: TripMode;
};

const stampStyles: Record<TripMode, { backgroundColor: string; color: string; label: string }> = {
  outbound: {
    backgroundColor: '#D8F0E2',
    color: '#176B43',
    label: 'Ida',
  },
  roundTrip: {
    backgroundColor: '#DDEBFF',
    color: '#255EA8',
    label: 'Vta',
  },
  special: {
    backgroundColor: '#FFE3C2',
    color: '#99510D',
    label: 'Esp.',
  },
};

export function TripStamp({ mode }: TripStampProps) {
  const colors = stampStyles[mode];

  return (
    <View style={[styles.stamp, { backgroundColor: colors.backgroundColor }]}>
      <Text numberOfLines={1} style={[styles.label, { color: colors.color }]}>
        {colors.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    width: '100%',
    minHeight: 18,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderRadius: 5,
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
