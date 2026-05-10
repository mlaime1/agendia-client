import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TripMode } from '../types';

type TripStampProps = {
  mode: TripMode;
};

const stampStyles: Record<TripMode, { backgroundColor: string; color: string }> = {
  outbound: {
    backgroundColor: '#DDF5E8',
    color: '#1F8A52',
  },
  roundTrip: {
    backgroundColor: '#DCEBFF',
    color: '#2E68B8',
  },
  special: {
    backgroundColor: '#FFE7C7',
    color: '#B56416',
  },
};

export function TripStamp({ mode }: TripStampProps) {
  const colors = stampStyles[mode];

  return (
    <View style={[styles.stamp, { backgroundColor: colors.backgroundColor }]}>
      <Text style={[styles.car, { color: colors.color }]}>🚗</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    minWidth: 24,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  car: {
    fontSize: 11,
    letterSpacing: 0,
  },
});
