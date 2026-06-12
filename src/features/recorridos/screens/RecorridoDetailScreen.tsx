import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Platform } from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme, useThemedStyles } from '../../../theme';
import { getMockRecorridoById } from '../data/mockRecorridos';
import { StopTimeline } from '../components/StopTimeline';
import { RatesGrid } from '../components/RatesGrid';
import type { RecorridoDetailScreenProps } from '../types';

type RecorridoDetailScreenInternalProps = RecorridoDetailScreenProps & {
  onMenuPress?: () => void;
};

export function RecorridoDetailScreen({
  recorridoId,
  onBack,
  onMenuPress,
}: RecorridoDetailScreenInternalProps) {
  const styles = useThemedStyles(createStyles);
  const recorrido = getMockRecorridoById(recorridoId);

  if (!recorrido) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Recorrido no encontrado</Text>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const dayLabelsDisplay = recorrido.days.join(', ');

  return (
    <ScreenWrapper
      onMenuPress={onMenuPress}
      onBackPress={onBack}
      title="Recorrido"
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero section */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <AppIcon name="map" size={24} color={styles.heroIconColor.color} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{recorrido.name}</Text>
            <Text style={styles.heroMeta}>
              {recorrido.clientName} · {dayLabelsDisplay}
            </Text>
          </View>
        </View>

        {/* Stops section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Paradas</Text>
            <Pressable style={styles.sectionButton}>
              <AppIcon name="edit" size={14} color={styles.sectionButtonIcon.color} />
              <Text style={styles.sectionButtonText}>Reordenar</Text>
            </Pressable>
          </View>
          <StopTimeline stops={recorrido.stops} />
          <Pressable style={styles.addStop}>
            <View style={styles.addStopIcon}>
              <AppIcon name="plus" size={14} color={styles.addStopIconColor.color} />
            </View>
            <Text style={styles.addStopLabel}>Agregar parada</Text>
          </Pressable>
        </View>

        {/* Rates section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tarifas</Text>
          </View>
          <RatesGrid rates={recorrido.rates} />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
          >
            <AppIcon name="trash" size={17} color={styles.deleteButtonIcon.color} />
            <Text style={styles.deleteButtonText}>Eliminar recorrido</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    headerIcon: {
      color: theme.colors.primary,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
    heroIcon: {
      width: 48,
      height: 48,
      borderRadius: theme.radii.medium,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    heroIconColor: {
      color: theme.colors.primaryLight,
    },
    heroInfo: {
      flex: 1,
    },
    heroName: {
      fontSize: theme.typography.size.lg,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.text,
    },
    heroMeta: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.textMuted,
      fontWeight: theme.typography.weight.medium,
      marginTop: 3,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.large,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xs,
    },
    sectionTitle: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.textMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    sectionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    sectionButtonIcon: {
      color: theme.colors.primary,
    },
    sectionButtonText: {
      fontSize: theme.typography.size.sm,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.primary,
    },
    addStop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    addStopIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: `${theme.colors.primary}40`,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    addStopIconColor: {
      color: theme.colors.primary,
    },
    addStopLabel: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.primary,
    },
    actions: {
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radii.medium,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: `${theme.colors.danger}33`,
    },
    deleteButtonPressed: {
      opacity: 0.7,
    },
    deleteButtonIcon: {
      color: theme.colors.danger,
    },
    deleteButtonText: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.danger,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      gap: theme.spacing.md,
    },
    errorText: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.text,
    },
    backButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.small,
    },
    backButtonText: {
      color: theme.colors.primaryLight,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
    },
  });
