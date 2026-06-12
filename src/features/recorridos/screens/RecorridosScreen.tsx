import React, { useMemo, useState } from 'react';
import {
  FlatList,
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
import { getMockRecorridosByClient } from '../data/mockRecorridos';
import { RecorridoCard } from '../components/RecorridoCard';
import type { RecorridoListScreenProps } from '../types';

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
  const recorridos = useMemo(
    () => getMockRecorridosByClient(selectedClientId),
    [selectedClientId],
  );

  const isEmpty = recorridos.length === 0;

  const headerBadge = (
    <View style={styles.headerBadge}>
      <View style={styles.headerBadgeDot} />
      <Text style={styles.headerBadgeText}>{recorridos.length} recorridos</Text>
    </View>
  );

  const renderRecorrido = ({ item }: { item: typeof recorridos[0] }) => (
    <RecorridoCard recorrido={item} onPress={onSelectRecorrido} />
  );

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
          data={recorridos}
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
  });
