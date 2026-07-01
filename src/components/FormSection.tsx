import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Theme } from '../theme';
import { useThemedStyles } from '../theme/useThemedStyles';

type FormSectionProps = {
  title?: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
};

export function FormSection({ title, children, rightAction }: FormSectionProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {rightAction}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.large,
      marginHorizontal: 16,
      marginBottom: 12,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 4,
    },
    title: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSubtle,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
