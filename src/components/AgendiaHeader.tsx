import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppIcon } from './AppIcon';
import { Theme, useTheme, useThemedStyles } from '../theme';

type ClientOption = {
  id: string;
  name: string;
};

type AgendiaHeaderProps = {
  userName: string;
  onTodayPress: () => void;
  onMenuPress: () => void;
  clients: ClientOption[];
  selectedClientId: string;
  onSelectClient?: (clientId: string) => void;
  onUserPress?: () => void;
  hideClientSelector?: boolean;
  profileActionsSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  expandedSlot?: React.ReactNode;
};

export function AgendiaHeader({
  userName,
  onTodayPress,
  onMenuPress,
  clients,
  selectedClientId,
  onSelectClient,
  onUserPress,
  hideClientSelector = false,
  profileActionsSlot,
  bottomSlot,
  expandedSlot,
}: AgendiaHeaderProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );
  const avatarLetter = (selectedClient?.name || userName).trim().charAt(0).toUpperCase() || 'A';

  const handleOpenClientSelector = () => {
    onUserPress?.();
    setClientModalVisible(true);
  };

  const handleSelectClient = (clientId: string) => {
    onSelectClient?.(clientId);
    setClientModalVisible(false);
  };

  return (
    <React.Fragment>
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
          {hideClientSelector ? (
            <View style={styles.userPillStatic}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userLabel}>Agenda de</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {selectedClient?.name || userName}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.userPill}
              onPress={handleOpenClientSelector}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Cambiar agenda"
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userLabel}>Viendo agenda de</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {selectedClient?.name || 'Seleccionar cliente'}
                </Text>
              </View>

              <AppIcon name="chevronDown" size={14} color={theme.colors.primary} style={styles.caret} />
            </TouchableOpacity>
          )}

          {profileActionsSlot ? (
            <View style={styles.profileActions}>{profileActionsSlot}</View>
          ) : null}
        </View>

        {bottomSlot ? <View style={styles.bottomSlot}>{bottomSlot}</View> : null}

        {expandedSlot ? <View style={styles.expandedSlot}>{expandedSlot}</View> : null}
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={clientModalVisible}
        onRequestClose={() => setClientModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setClientModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar cliente</Text>
              <Pressable
                onPress={() => setClientModalVisible(false)}
                style={styles.modalClose}
                accessibilityRole="button"
                accessibilityLabel="Cerrar selector"
              >
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>

            <FlatList
              data={clients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedClientId;

                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.clientRow,
                      isSelected && styles.clientRowSelected,
                      pressed && styles.clientRowPressed,
                    ]}
                    onPress={() => handleSelectClient(item.id)}
                  >
                    <Text style={[styles.clientRowText, isSelected && styles.clientRowTextSelected]}>
                      {item.name}
                    </Text>
                    {isSelected ? <Text style={styles.clientRowCheck}>✓</Text> : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={styles.modalEmpty}>No hay clientes disponibles</Text>}
            />
          </View>
        </View>
      </Modal>
    </React.Fragment>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  header: {
    backgroundColor: theme.colors.surface,
    paddingTop: 12,
    paddingRight: 20,
    paddingBottom: 16,
    paddingLeft: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
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
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  todayButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  todayButtonText: {
    color: theme.colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 999,
    paddingTop: 7,
    paddingRight: 14,
    paddingBottom: 7,
    paddingLeft: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 0,
    maxWidth: '78%',
  },
  userPillStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 999,
    paddingTop: 7,
    paddingRight: 14,
    paddingBottom: 7,
    paddingLeft: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 0,
    maxWidth: '78%',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textInverse,
  },
  userInfo: {
    minWidth: 0,
  },
  userLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  caret: {
    marginLeft: 2,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomSlot: {
    marginTop: 14,
  },
  expandedSlot: {
    marginTop: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 18,
    maxHeight: '62%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  modalCloseText: {
    color: theme.colors.primary,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '700',
  },
  clientRow: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceMuted,
  },
  clientRowSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  clientRowPressed: {
    opacity: 0.8,
  },
  clientRowText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  clientRowTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  clientRowCheck: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  modalEmpty: {
    color: theme.colors.textSubtle,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
