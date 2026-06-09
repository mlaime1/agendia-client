import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { Theme } from '../../../theme';
import { AppIcon, AppIconName } from '../../../components/AppIcon';

type ProfileSectionProps = {
  title?: string;
  children: React.ReactNode;
};

export function ProfileSection({ title, children }: ProfileSectionProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

type ProfileRowProps = {
  icon: AppIconName;
  label: string;
  value: string;
  readonly?: boolean;
};

export function ProfileRow({ icon, label, value, readonly }: ProfileRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <View style={styles.iconContainer}>
        <AppIcon name={icon} size={17} color="primary" />
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      {readonly && <Text style={styles.badge}>Solo lectura</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    title: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 4,
    },
    content: {
      paddingHorizontal: 18,
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 0,
      gap: 14,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    iconContainer: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    label: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      lineHeight: 1,
      marginBottom: 3,
    },
    value: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
      lineHeight: 1.2,
    },
    badge: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      backgroundColor: theme.colors.background,
      borderRadius: 999,
      paddingVertical: 3,
      paddingHorizontal: 8,
      flexShrink: 0,
    },
  });
