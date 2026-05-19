import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type AgendiaHeaderProps = {
  userName: string;
  tripCount: number;
  onTodayPress: () => void;
  onUserPress: () => void;
  onMenuPress: () => void;
  rightSlot?: React.ReactNode;
};

export function AgendiaHeader({
  userName,
  tripCount,
  onTodayPress,
  onUserPress,
  onMenuPress,
  rightSlot,
}: AgendiaHeaderProps) {
  const avatarLetter = userName.trim().charAt(0).toUpperCase() || 'A';
  const tripsLabel = `${tripCount} ${tripCount === 1 ? 'viaje' : 'viajes'}`;

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.menu}
          onPress={onMenuPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
        >
          <View style={[styles.menuLine, styles.menuLineFirst]} />
          <View style={[styles.menuLine, styles.menuLineSecond]} />
          <View style={[styles.menuLine, styles.menuLineThird]} />
        </TouchableOpacity>

        <Text style={styles.title}>Agendia</Text>

        <TouchableOpacity
          style={styles.todayButton}
          onPress={onTodayPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Ir a hoy"
        >
          <Text style={styles.todayButtonText}>Hoy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.userRow}>
        <TouchableOpacity
          style={styles.userPill}
          onPress={onUserPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Cambiar usuario"
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>

          <View>
            <Text style={styles.userLabel}>Viendo agenda de</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>

          <Text style={styles.caret}>⌄</Text>
        </TouchableOpacity>

        {rightSlot ?? (
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>{tripsLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingRight: 20,
    paddingBottom: 16,
    paddingLeft: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(27,94,59,0.12)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  menu: {
    flexDirection: 'column',
    gap: 5,
    padding: 4,
  },
  menuLine: {
    height: 2.5,
    borderRadius: 4,
    backgroundColor: '#1B5E3B',
  },
  menuLineFirst: {
    width: 22,
  },
  menuLineSecond: {
    width: 16,
  },
  menuLineThird: {
    width: 19,
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: '700',
    color: '#1B5E3B',
    letterSpacing: -0.5,
  },
  todayButton: {
    backgroundColor: '#1B5E3B',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingTop: 7,
    paddingRight: 14,
    paddingBottom: 7,
    paddingLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(27,94,59,0.13)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1B5E3B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E8F5E9',
  },
  userLabel: {
    fontSize: 11,
    color: '#3a7a52',
    fontWeight: '500',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B5E3B',
  },
  caret: {
    color: '#1B5E3B',
    fontSize: 14,
    marginLeft: 2,
  },
  badge: {
    backgroundColor: '#1B5E3B',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7ec99a',
  },
  badgeText: {
    color: '#E8F5E9',
    fontSize: 12,
    fontWeight: '600',
  },
});
