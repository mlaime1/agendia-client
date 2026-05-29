import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Switch, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { AgendiaHeader } from '../../../components/AgendiaHeader';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileSection, ProfileRow } from '../components/ProfileSection';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { Theme } from '../../../theme';
import { useTheme } from '../../../theme/ThemeContext';
import type { ProfileScreenProps, WorkingDaysData } from '../types';

const DAYS_OF_WEEK: Array<{ key: keyof WorkingDaysData; label: string }> = [
  { key: 'monday', label: 'L' },
  { key: 'tuesday', label: 'M' },
  { key: 'wednesday', label: 'X' },
  { key: 'thursday', label: 'J' },
  { key: 'friday', label: 'V' },
  { key: 'saturday', label: 'S' },
  { key: 'sunday', label: 'D' },
];

export function ProfileScreen({ userProfile, onMenuPress }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { setThemePreference, themePreference } = useTheme();

  const [workingDays, setWorkingDays] = useState<WorkingDaysData>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const isDriver = userProfile.role === 'driver' || userProfile.role === 'admin';

  const handleDayToggle = (day: keyof WorkingDaysData) => {
    setWorkingDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <AgendiaHeader title="Mi Perfil" onMenuPress={onMenuPress} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ProfileHeader
            user={{
              name: userProfile.name,
              email: userProfile.email,
              role: userProfile.role,
            }}
          />

          {/* Información Personal */}
          <ProfileSection title="Información personal">
            <ProfileRow icon="user" label="Nombre" value={userProfile.name} readonly />
            <ProfileRow icon="mail" label="Email" value={userProfile.email} readonly />
            {userProfile.alias && (
              <ProfileRow icon="tag" label="Alias" value={userProfile.alias} />
            )}
          </ProfileSection>

          {/* Stats para Conductores */}
          {isDriver && (
            <ProfileSection title="Estadísticas">
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>24</Text>
                  <Text style={styles.statLabel}>Viajes</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>$1,240</Text>
                  <Text style={styles.statLabel}>Ganancias</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>4.8</Text>
                  <Text style={styles.statLabel}>Calificación</Text>
                </View>
              </View>
            </ProfileSection>
          )}

          {/* Días Laborales */}
          {isDriver && (
            <ProfileSection title="Días de trabajo">
              <View style={styles.daysContainer}>
                {DAYS_OF_WEEK.map(({ key, label }) => (
                  <Pressable
                    key={key}
                    onPress={() => handleDayToggle(key)}
                    style={[styles.dayButton, workingDays[key] && styles.dayButtonActive]}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        workingDays[key] && styles.dayLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ProfileSection>
          )}

          {/* Preferencias */}
          <ProfileSection title="Preferencias">
            <View style={styles.toggleRow}>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleLabel}>Notificaciones</Text>
                <Text style={styles.toggleDescription}>Recibe alertas importantes</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            </View>
          </ProfileSection>

          {/* Botones de acción */}
          <View style={styles.actionsContainer}>
            <Pressable style={styles.buttonPrimary}>
              <Text style={styles.buttonText}>Guardar cambios</Text>
            </Pressable>
            <Pressable style={styles.buttonDanger}>
              <Text style={styles.buttonDangerText}>Cerrar sesión</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    statsContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: 'center',
      gap: 3,
    },
    statNumber: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.primary,
      lineHeight: 1,
    },
    statLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },
    daysContainer: {
      display: 'flex',
      flexDirection: 'row',
      gap: 5,
      paddingHorizontal: 18,
      paddingVertical: 12,
      flexWrap: 'wrap',
    },
    dayButton: {
      width: 28,
      height: 28,
      borderRadius: 999,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    dayButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    dayLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    dayLabelActive: {
      color: theme.colors.surface,
    },
    toggleRow: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 18,
      gap: 14,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    toggleContent: {
      flex: 1,
    },
    toggleLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 3,
    },
    toggleDescription: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    actionsContainer: {
      marginHorizontal: 16,
      marginTop: 12,
      gap: 8,
    },
    buttonPrimary: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.surface,
    },
    buttonDanger: {
      backgroundColor: 'transparent',
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'rgba(192, 57, 43, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonDangerText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#c0392b',
    },
  });
