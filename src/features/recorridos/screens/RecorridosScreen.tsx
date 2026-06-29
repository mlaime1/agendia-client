import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme, useThemedStyles } from '../../../theme';
import { useItineraries } from '../hooks/useItineraries';
import { RecorridoCard } from '../components/RecorridoCard';
import type { RecorridoListScreenProps } from '../types';
import type { Itinerary } from '../../../services/types';

type RecorridosScreenProps = RecorridoListScreenProps & {
  onSelectRecorrido: (recorridoId: string) => void;
  onCreateRecorrido: () => void;
};

export function RecorridosScreen({
  onMenuPress,
  selectedClientId,
  onSelectRecorrido,
  onCreateRecorrido,
}: RecorridosScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { itineraries, loading, error, refetch } = useItineraries();

  const filteredItineraries = useMemo(
    () => itineraries.filter((i) => i.client_id === selectedClientId),
    [itineraries, selectedClientId],
  );

  const isEmpty = !loading && filteredItineraries.length === 0;

  const headerBadge = (
    <View style={styles.headerBadge}>
      <View style={styles.headerBadgeDot} />
      <Text style={styles.headerBadgeText}>
        {loading ? '...' : `${filteredItineraries.length} recorridos`}
      </Text>
    </View>
  );

  const renderRecorrido = ({ item }: { item: Itinerary }) => (
    <RecorridoCard recorrido={item} onPress={onSelectRecorrido} />
  );

  if (error) {
    return (
      <ScreenWrapper title="Recorridos" onMenuPress={onMenuPress} rightSlot={headerBadge}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper
      title="Recorridos"
      onMenuPress={onMenuPress}
      rightSlot={headerBadge}
    >
      <View style={styles.listHeader}>
        <Text style={styles.listLabel}>RECORRIDOS</Text>
        <Pressable
          style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}
          onPress={onCreateRecorrido}
        >
          <AppIcon name="plus" size={16} color={styles.newButtonText.color} />
          <Text style={styles.newButtonText}>Nuevo</Text>
        </Pressable>
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <AppIcon name="map" size={40} color={styles.emptyIconColor.color} />
          </View>
          <Text style={styles.emptyText}>Sin recorridos para este cliente</Text>
          <Text style={styles.emptySubtext}>Crea uno nuevo para comenzar</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItineraries}
          keyExtractor={(item) => item.id}
          renderItem={renderRecorrido}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      )}
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    listLabel: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.textSubtle,
      letterSpacing: 0.5,
    },
    newButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.small,
      paddingVertical: 7,
      paddingHorizontal: 13,
    },
    newButtonPressed: {
      opacity: 0.85,
    },
    newButtonText: {
      color: theme.colors.primaryLight,
      fontSize: theme.typography.size.sm,
      fontWeight: theme.typography.weight.semibold,
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.pill,
      paddingVertical: 3,
      paddingHorizontal: theme.spacing.sm,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}40`,
    },
    headerBadgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
    },
    headerBadgeText: {
      fontSize: theme.typography.size.xs,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.text,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 32,
      gap: theme.spacing.md,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      gap: theme.spacing.md,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: theme.radii.medium,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyIconColor: {
      color: theme.colors.primary,
    },
    emptyText: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.text,
    },
    emptySubtext: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    errorState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    errorText: {
      fontSize: theme.typography.size.md,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radii.medium,
    },
    retryButtonText: {
      color: theme.colors.primaryLight,
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
    },
  });
