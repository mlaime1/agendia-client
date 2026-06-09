import React, { useMemo, useState } from 'react';
import {
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
import { MOCK_CLIENTS } from '../mockData';
import type { ClientFull } from '../types';

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

function getActiveDays(schedules: ClientFull['schedules']): Set<number> {
  const days = new Set<number>();
  schedules.forEach((s) => {
    if (s.is_active && s.day_of_week >= 1 && s.day_of_week <= 5) {
      days.add(s.day_of_week);
    }
  });
  return days;
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'A';
}

export function ClientsListScreen({ onMenuPress, onSelectClient, onNewClient }: ClientsListScreenProps) {
  const styles = useThemedStyles(createStyles);
  const [search, setSearch] = useState('');

  const { activeClients, inactiveClients } = useMemo(() => {
    const query = search.toLowerCase().trim();
    const filtered = MOCK_CLIENTS.filter((c) =>
      c.nombre.toLowerCase().includes(query),
    );
    return {
      activeClients: filtered.filter((c) => c.is_active),
      inactiveClients: filtered.filter((c) => !c.is_active),
    };
  }, [search]);

  const activeCount = MOCK_CLIENTS.filter((c) => c.is_active).length;

  const renderClientCard = ({ item }: { item: ClientFull }) => {
    const activeDays = getActiveDays(item.schedules);
    const initial = getInitial(item.nombre);
    const billingLabel = BILLING_LABELS[item.billing_cycle] || 'Mensual';

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => onSelectClient(item.id)}
      >
        <View style={[styles.avatar, !item.is_active && styles.avatarInactive]}>
          <Text style={[styles.avatarText, !item.is_active && styles.avatarTextInactive]}>
            {initial}
          </Text>
        </View>

        <View style={styles.cardInfo}>
          <Text
            style={[styles.clientName, !item.is_active && styles.clientNameInactive]}
            numberOfLines={1}
          >
            {item.nombre}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={styles.address} numberOfLines={1}>
              {item.address}
            </Text>
            {item.schedules.length > 0 && (
              <>
                <View style={styles.dotSep} />
                <View style={styles.daysRow}>
                  {DAY_LABELS.map((label, index) => {
                    const dayNum = index + 1;
                    const isOn = activeDays.has(dayNum);
                    return (
                      <View key={label} style={[styles.dayCircle, isOn ? styles.dayOn : styles.dayOff]}>
                        <Text style={[styles.dayText, isOn ? styles.dayTextOn : styles.dayTextOff]}>
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.cardRight}>
          <View style={[styles.billingTag, !item.is_active && styles.billingTagInactive]}>
            <Text style={[styles.billingTagText, !item.is_active && styles.billingTagTextInactive]}>
              {billingLabel}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, item.is_active ? styles.statusDotActive : styles.statusDotInactive]} />
            <AppIcon name="chevronRight" size={16} color={styles.chevronColor.color} />
          </View>
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = (label: string) => (
    <View style={styles.sectionDivider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>{label}</Text>
      <View style={styles.dividerLine} />
    </View>
  );

  const sections = [];
  if (activeClients.length > 0) {
    sections.push({ type: 'header' as const, label: 'Todos los clientes' });
    sections.push(...activeClients.map((c) => ({ type: 'client' as const, data: c })));
  }
  if (inactiveClients.length > 0) {
    sections.push({ type: 'divider' as const, label: 'Inactivos' });
    sections.push(...inactiveClients.map((c) => ({ type: 'client' as const, data: c })));
  }

  const isEmpty = activeClients.length === 0 && inactiveClients.length === 0;

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

      {isEmpty ? (
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
    avatarInactive: {
      backgroundColor: theme.colors.disabled,
    },
    avatarText: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.primaryLight,
    },
    avatarTextInactive: {
      color: theme.colors.surface,
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
    clientNameInactive: {
      color: theme.colors.textSubtle,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    address: {
      fontSize: 12,
      color: theme.colors.textSubtle,
      maxWidth: 160,
    },
    dotSep: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: theme.colors.border,
    },
    daysRow: {
      flexDirection: 'row',
      gap: 3,
    },
    dayCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayOn: {
      backgroundColor: theme.colors.primary,
    },
    dayOff: {
      backgroundColor: theme.colors.background,
    },
    dayText: {
      fontSize: 9,
      fontWeight: '700',
    },
    dayTextOn: {
      color: theme.colors.primaryLight,
    },
    dayTextOff: {
      color: theme.colors.disabled,
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
    billingTagInactive: {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
    },
    billingTagText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    billingTagTextInactive: {
      color: theme.colors.disabled,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusDotActive: {
      backgroundColor: theme.colors.primary,
    },
    statusDotInactive: {
      backgroundColor: theme.colors.disabled,
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
