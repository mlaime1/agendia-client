import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme, useThemedStyles } from '../../../theme';
import { useItineraryDetail } from '../hooks/useItineraryDetail';
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
  const { itinerary, stops, rates, loading, error, refetch, deleteItinerary } =
    useItineraryDetail(recorridoId);

  if (loading) {
    return (
      <ScreenWrapper onMenuPress={onMenuPress} onBackPress={onBack} title="Recorrido">
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando recorrido...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !itinerary) {
    return (
      <ScreenWrapper onMenuPress={onMenuPress} onBackPress={onBack} title="Recorrido">
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Recorrido no encontrado'}</Text>
          <Pressable style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Volver</Text>
          </Pressable>
          {error && (
            <Pressable style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </Pressable>
          )}
        </View>
      </ScreenWrapper>
    );
  }

  const clientName = itinerary.clients?.nombre || 'Sin cliente';

  return (
    <ScreenWrapper
      onMenuPress={onMenuPress}
      onBackPress={onBack}
      title="Recorrido"
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <AppIcon name="map" size={24} color={styles.heroIconColor.color} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{itinerary.name}</Text>
            <Text style={styles.heroMeta}>{clientName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Paradas</Text>
            <Pressable style={styles.sectionButton}>
              <AppIcon name="edit" size={14} color={styles.sectionButtonIcon.color} />
              <Text style={styles.sectionButtonText}>Reordenar</Text>
            </Pressable>
          </View>
          <StopTimeline stops={stops} />
          <Pressable style={styles.addStop}>
            <View style={styles.addStopIcon}>
              <AppIcon name="plus" size={14} color={styles.addStopIconColor.color} />
            </View>
            <Text style={styles.addStopLabel}>Agregar parada</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tarifas</Text>
          </View>
          <RatesGrid rates={rates} />
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
            onPress={deleteItinerary}
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: theme.typography.size.md,
      color: theme.colors.textMuted,
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
      padding: theme.spacing.xl,
    },
    errorText: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.text,
      textAlign: 'center',
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
    retryButton: {
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.small,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    retryButtonText: {
      color: theme.colors.primary,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
    },
  });
