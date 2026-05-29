import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme, ThemePreference } from '../../../theme';
import { useTheme } from '../../../theme/ThemeContext';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import type { ProfileScreenProps } from '../types';

const DRIVER_STATS = [
  { value: '8', label: 'Clientes activos' },
  { value: '214', label: 'Viajes este mes' },
  { value: '98%', label: 'Puntualidad' },
];

const AGREED_DAYS = [
  { label: 'L', enabled: true },
  { label: 'M', enabled: true },
  { label: 'X', enabled: false },
  { label: 'J', enabled: false },
  { label: 'V', enabled: false },
  { label: 'S', enabled: false },
  { label: 'D', enabled: false },
];

const PROFILE_THEMES: Array<{
  value: ThemePreference;
  label: string;
  leftColor: string;
  rightColor: string;
}> = [
  { value: 'default', label: 'Default', leftColor: '#1B5E3B', rightColor: '#E8F5E9' },
  { value: 'light', label: 'Light', leftColor: '#F5F5F5', rightColor: '#FFFFFF' },
  { value: 'dark', label: 'Dark', leftColor: '#1A1A2E', rightColor: '#16213E' },
  { value: 'pinkBloom', label: 'Pink', leftColor: '#FF5CA8', rightColor: '#FFE8F3' },
  { value: 'pinkNight', label: 'Pink Night', leftColor: '#2A1D3F', rightColor: '#FF8FC7' },
];

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'A';
}

function getRoleLabel(role: ProfileScreenProps['userProfile']['role']) {
  if (role === 'client') {
    return 'Pasajera';
  }

  return 'Conductor';
}

type InfoRowProps = {
  icon: 'user' | 'message' | 'map' | 'fileText' | 'calendar' | 'mail';
  label: string;
  value: string;
  readonly?: boolean;
  showChevron?: boolean;
};

function InfoRow({ icon, label, value, readonly, showChevron }: InfoRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <View style={styles.rowIconWrap}>
        <AppIcon name={icon} size={17} color={styles.iconColor.color} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {readonly ? <Text style={styles.readonlyBadge}>Solo lectura</Text> : null}
      {showChevron ? <AppIcon name="chevronRight" size={16} color={styles.chevronColor.color} /> : null}
    </View>
  );
}

type ThemeOptionProps = {
  value: ThemePreference;
  label: string;
  leftColor: string;
  rightColor: string;
  selected: boolean;
  onPress: () => void;
};

function ThemeOption({ value, label, leftColor, rightColor, selected, onPress }: ThemeOptionProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      key={value}
      onPress={onPress}
      style={({ pressed }) => [styles.themeOption, pressed && styles.themeOptionPressed]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={[styles.themeSwatch, selected && styles.themeSwatchSelected]}>
        <View style={[styles.themeHalf, { backgroundColor: leftColor }]} />
        <View style={[styles.themeHalf, { backgroundColor: rightColor }]} />
        {selected ? <View style={styles.themeSelectedDot} /> : null}
      </View>
      <Text style={[styles.themeLabel, selected && styles.themeLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

export function ProfileScreen({ userProfile, onMenuPress }: ProfileScreenProps) {
  const { themePreference, setThemePreference } = useTheme();
  const styles = useThemedStyles(createStyles);

  const isDriver = userProfile.role === 'driver' || userProfile.role === 'admin';

  const phone = isDriver ? '+54 9 11 6734-2210' : '+54 9 11 4523-0987';
  const address = isDriver ? 'Av. Corrientes 1847, CABA' : 'Av. Rivadavia 4521, CABA';

  return (
    <ScreenWrapper title="Mi perfil" onMenuPress={onMenuPress}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(userProfile.name)}</Text>
          </View>
          <Text style={styles.heroName}>{userProfile.name}</Text>
          <Text style={styles.heroRole}>{getRoleLabel(userProfile.role)}</Text>
        </View>

        {isDriver ? (
          <View style={styles.statsRow}>
            {DRIVER_STATS.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={[styles.section, isDriver && styles.sectionAfterStats]}>
          <Text style={styles.sectionTitle}>Datos personales</Text>
          <InfoRow icon="user" label="Nombre completo" value={userProfile.name} />
          <InfoRow icon="message" label="Telefono" value={phone} />
          <InfoRow icon="mail" label="Email" value={userProfile.email} />
          <InfoRow icon="map" label="Direccion" value={address} />
        </View>

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Editar perfil</Text>
        </Pressable>

        {!isDriver ? (
          <>
            <View style={styles.spacer} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Acuerdo de servicio</Text>
              <View style={styles.row}>
                <View style={styles.rowIconWrap}>
                  <AppIcon name="calendar" size={17} color={styles.iconColor.color} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Dias pactados</Text>
                  <View style={styles.daysWrap}>
                    {AGREED_DAYS.map((day) => (
                      <View
                        key={day.label}
                        style={[styles.day, day.enabled ? styles.dayOn : styles.dayOff]}
                      >
                        <Text style={[styles.dayText, day.enabled ? styles.dayTextOn : styles.dayTextOff]}>
                          {day.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.readonlyBadge}>Solo lectura</Text>
              </View>

              <InfoRow icon="fileText" label="Periodo de facturacion" value="Mensual" readonly />
              <InfoRow icon="user" label="Conductor asignado" value="Mauro Aime" readonly />
            </View>
          </>
        ) : null}

        <View style={styles.spacer} />

        <View style={[styles.section, isDriver && styles.sectionWithStats]}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themesScroll}
          >
            {PROFILE_THEMES.map((option) => {
              const isSelected = option.value === themePreference;
              return (
                <ThemeOption
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  leftColor={option.leftColor}
                  rightColor={option.rightColor}
                  selected={isSelected}
                  onPress={() => {
                    void setThemePreference(option.value);
                  }}
                />
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.spacer} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          <InfoRow icon="fileText" label="Contrasena" value="Cambiar contrasena" showChevron />
        </View>

        <View style={styles.spacer} />

        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cerrar sesion</Text>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingTop: 10,
      paddingBottom: 32,
    },
    hero: {
      alignItems: 'center',
      paddingTop: 18,
      paddingBottom: 16,
      paddingHorizontal: 20,
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
      color: theme.colors.primaryLight,
    },
    heroName: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
    },
    heroRole: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: 4,
      paddingHorizontal: 14,
      overflow: 'hidden',
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: 'center',
      gap: 3,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 11,
      color: theme.colors.textMuted,
      fontWeight: '500',
      textAlign: 'center',
    },
    section: {
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSubtle,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 18,
      gap: 14,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    rowIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: theme.colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    rowContent: {
      flex: 1,
    },
    rowLabel: {
      fontSize: 11,
      color: theme.colors.textSubtle,
      fontWeight: '500',
      marginBottom: 3,
    },
    rowValue: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
      lineHeight: 18,
    },
    readonlyBadge: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.colors.textSubtle,
      backgroundColor: theme.colors.background,
      borderRadius: 999,
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      flexShrink: 0,
    },
    daysWrap: {
      flexDirection: 'row',
      gap: 5,
      marginTop: 6,
      flexWrap: 'wrap',
    },
    day: {
      width: 28,
      height: 28,
      borderRadius: 999,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    dayOn: {
      backgroundColor: theme.colors.primary,
    },
    dayOff: {
      backgroundColor: theme.colors.background,
    },
    dayText: {
      fontSize: 11,
      fontWeight: '700',
    },
    dayTextOn: {
      color: theme.colors.primaryLight,
    },
    dayTextOff: {
      color: theme.colors.disabled,
    },
    iconColor: {
      color: theme.colors.primary,
    },
    chevronColor: {
      color: theme.colors.disabled,
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      marginHorizontal: 16,
      marginTop: 4,
      paddingVertical: 13,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primaryLight,
    },
    spacer: {
      height: 8,
    },
    themesGrid: {
      flexDirection: 'row',
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 16,
      alignItems: 'center',
    },
    themeOption: {
      minWidth: 84,
      alignItems: 'center',
      gap: 6,
      marginRight: 12,
    },
    themeOptionPressed: {
      opacity: 0.75,
    },
    themeSwatch: {
      width: 52,
      height: 52,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      overflow: 'hidden',
      flexDirection: 'row',
      position: 'relative',
    },
    themeSwatchSelected: {
      borderColor: theme.colors.primary,
    },
    themeHalf: {
      flex: 1,
    },
    themeSelectedDot: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderRadius: 6,
      right: 5,
      bottom: 5,
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    themeLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.textSubtle,
    },
    themeLabelSelected: {
      color: theme.colors.primary,
    },
    themesScroll: {
      paddingHorizontal: 18,
      alignItems: 'center',
      paddingBottom: 16,
    },
    sectionAfterStats: {
      marginTop: 20,
    },
    sectionWithStats: {
      marginTop: 12,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      marginHorizontal: 16,
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'rgba(192, 57, 43, 0.25)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#c0392b',
    },
  });
