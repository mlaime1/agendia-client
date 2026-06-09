import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme } from '../../../theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { useClients } from '../hooks';
import type { Client } from '../../../services/types';

type ClientsListScreenProps = {
  onMenuPress: () => void;
  onSelectClient: (clientId: string) => void;
  onNewClient: () => void;
};

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V'];

const BILLING_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'A';
}

export function ClientsListScreen({ onMenuPress, onSelectClient, onNewClient }: ClientsListScreenProps) {
  const styles = useThemedStyles(createStyles);
  const [search, setSearch] = useState('');
  const { clients, loading, error, refetch } = useClients();

  const { activeClients, inactiveClients } = useMemo(() => {
    const query = search.toLowerCase().trim();
    const filtered = clients.filter((c) =>
      c.nombre.toLowerCase().includes(query),
    );
    return {
      activeClients: filtered,
      inactiveClients: [] as Client[],
    };
  }, [clients, search]);

  const activeCount = clients.length;

  const renderClientCard = ({ item }: { item: Client }) => {
    const initial = getInitial(item.nombre);
    const billingLabel = BILLING_LABELS[item.billing_cycle] || 'Mensual';

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => onSelectClient(item.id)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.clientName} numberOfLines={1}>
            {item.nombre}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={styles.phone} numberOfLines={1}>
              {item.phone}
            </Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={styles.billingTag}>
            <Text style={styles.billingTagText}>{billingLabel}</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusDotActive} />
            <AppIcon name="chevronRight" size={16} color={styles.chevronColor.color} />
          </View>
        </View>
      </Pressable>
    );
  };

  const sections = [];
  if (activeClients.length > 0) {
    sections.push({ type: 'header' as const, label: 'Todos los clientes' });
    sections.push(...activeClients.map((c) => ({ type: 'client' as const, data: c })));
  }
  if (inactiveClients.length > 0) {
    sections.push({ type: 'divider' as const, label: 'Inactivos' });
    sections.push(...inactiveClients.map((c) => ({ type: 'client' as const, data: c })));
  }

  const isEmpty = !loading && activeClients.length === 0 && inactiveClients.length === 0;

  const renderSectionHeader = (label: string) => (
    <View style={styles.sectionDivider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );

  return (
    <ScreenWrapper
      title="Clientes"
      onMenuPress={onMenuPress}
      rightSlot={
        <View style={styles.headerBadge}>
          <View style={styles.headerBadgeDot} />
          <Text style={styles.headerBadgeText}>{activeCount} activos</Text>
        </View>
      }
    >
      <View style={styles.searchContainer}>
        <AppIcon name="search" size={18} color={styles.searchIconColor.color} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          placeholderTextColor={styles.placeholderColor.color}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listLabel}>TODOS LOS CLIENTES</Text>
        <Pressable
          style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}
          onPress={onNewClient}
        >
          <AppIcon name="plus" size={16} color={styles.newButtonText.color} />
          <Text style={styles.newButtonText}>Nuevo cliente</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={styles.loadingColor.color} />
          <Text style={styles.loadingText}>Cargando clientes...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <AppIcon name="alert" size={40} color={styles.errorIconColor.color} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            onPress={refetch}
          >
            <AppIcon name="refresh" size={16} color={styles.retryButtonText.color} />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyState}>
          <AppIcon name="users" size={40} color={styles.emptyIconColor.color} />
          <Text style={styles.emptyText}>No se encontraron clientes</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item, index) =>
            item.type === 'client' ? item.data.id : `${item.type}-${index}`
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return null;
            }
            if (item.type === 'divider') {
              return renderSectionHeader(item.label);
            }
            return renderClientCard({ item: item.data });
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchIconColor: {
      color: theme.colors.textSubtle,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.text,
    },
    placeholderColor: {
      color: theme.colors.textSubtle,
    },
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    listLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSubtle,
      letterSpacing: 0.5,
    },
    newButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 7,
      paddingHorizontal: 13,
    },
    newButtonPressed: {
      opacity: 0.85,
    },
    newButtonText: {
      color: theme.colors.primaryLight,
      fontSize: 13,
      fontWeight: '600',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      gap: 14,
    },
    cardPressed: {
      opacity: 0.92,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.primaryLight,
    },
    cardInfo: {
      flex: 1,
      minWidth: 0,
    },
    clientName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 3,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    phone: {
      fontSize: 12,
      color: theme.colors.textSubtle,
      maxWidth: 160,
    },
    cardRight: {
      alignItems: 'flex-end',
      gap: 8,
    },
    billingTag: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: 999,
      paddingVertical: 3,
      paddingHorizontal: 9,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    billingTagText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    statusDotActive: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
    },
    chevronColor: {
      color: theme.colors.disabled,
    },
    sectionDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      marginVertical: 4,
    },
    dividerLine: {
      flex: 1,
      height: 0.5,
      backgroundColor: theme.colors.border,
    },
    dividerLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.disabled,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.colors.primary,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    headerBadgeDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.primaryLight,
    },
    headerBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primaryLight,
    },
    loadingState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      gap: 12,
    },
    loadingColor: {
      color: theme.colors.primary,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.textSubtle,
      fontWeight: '500',
    },
    errorState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      gap: 12,
    },
    errorIconColor: {
      color: theme.colors.danger,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.danger,
      fontWeight: '500',
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginTop: 8,
    },
    retryButtonPressed: {
      opacity: 0.85,
    },
    retryButtonText: {
      color: theme.colors.primaryLight,
      fontSize: 14,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
      gap: 12,
    },
    emptyIconColor: {
      color: theme.colors.disabled,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textSubtle,
      fontWeight: '500',
    },
  });
