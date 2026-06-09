import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { Theme } from '../../../theme';

type User = {
  name: string;
  email: string;
  role: string;
};

type ProfileHeaderProps = {
  user: User;
};

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const styles = useThemedStyles(createStyles);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Administrador',
      driver: 'Conductor',
      client: 'Cliente',
    };
    return roleMap[role] || role;
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
      </View>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.role}>{getRoleLabel(user.role)}</Text>
      <Text style={styles.email}>{user.email}</Text>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 28,
      backgroundColor: theme.colors.background,
    },
    avatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    avatarText: {
      fontSize: 28,
      fontWeight: '700',
      color: theme.colors.surface,
    },
    name: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
    },
    role: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.primary,
      backgroundColor: theme.colors.surface,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 14,
      overflow: 'hidden',
    },
    email: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
  });
