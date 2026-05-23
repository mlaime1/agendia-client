import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TripMode } from '../types';
import { Theme, useTheme, useThemedStyles } from '../../../theme';

type TripStampProps = {
  mode: TripMode;
};

const stampLabels: Record<TripMode, string> = {
  outbound: 'Ida',
  roundTrip: 'Vta',
  special: 'Esp.',
};

export function TripStamp({ mode }: TripStampProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const colors = theme.colors.trip[mode];

  return (
    <View style={[styles.stamp, { backgroundColor: colors.bg }]}>
      <Text numberOfLines={1} style={[styles.label, { color: colors.text }]}>
        {stampLabels[mode]}
      </Text>
    </View>
  );
}

const createStyles = (_theme: Theme) => StyleSheet.create({
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
