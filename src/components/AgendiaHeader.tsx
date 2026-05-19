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

type ClientOption = {
  id: string;
  name: string;
};

type AgendiaHeaderProps = {
  userName: string;
  tripCount: number;
  onTodayPress: () => void;
  onMenuPress: () => void;
  clients: ClientOption[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  onUserPress?: () => void;
  rightSlot?: React.ReactNode;
};

export function AgendiaHeader({
  userName,
  tripCount,
  onTodayPress,
  onMenuPress,
  clients,
  selectedClientId,
  onSelectClient,
  onUserPress,
  rightSlot,
}: AgendiaHeaderProps) {
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );
  const avatarLetter = (selectedClient?.name || userName).trim().charAt(0).toUpperCase() || 'A';
  const tripsLabel = `${tripCount} ${tripCount === 1 ? 'viaje' : 'viajes'}`;

  const handleOpenClientSelector = () => {
    onUserPress?.();
    setClientModalVisible(true);
  };

  const handleSelectClient = (clientId: string) => {
    onSelectClient(clientId);
    setClientModalVisible(false);
  };

  return (
    <>
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
    </>
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
  userInfo: {
    minWidth: 0,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    color: '#1B5E3B',
    fontSize: 16,
    fontWeight: '800',
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F6F1',
  },
  modalCloseText: {
    color: '#1B5E3B',
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
    backgroundColor: '#F7FAF7',
  },
  clientRowSelected: {
    backgroundColor: '#E8F5E9',
  },
  clientRowPressed: {
    opacity: 0.8,
  },
  clientRowText: {
    color: '#58665B',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  clientRowTextSelected: {
    color: '#1B5E3B',
    fontWeight: '700',
  },
  clientRowCheck: {
    color: '#1B5E3B',
    fontSize: 16,
    fontWeight: '700',
  },
  modalEmpty: {
    color: '#7A9E8A',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
