import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme';
import type { Client } from '../../../services/types';

type SummaryClientSelectorProps = {
  visible: boolean;
  clients: Client[];
  selectedClientId: string;
  onSelect: (clientId: string) => void;
  onClose: () => void;
};

export function SummaryClientSelector({
  visible,
  clients,
  selectedClientId,
  onSelect,
  onClose,
}: SummaryClientSelectorProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Seleccionar cliente</Text>
            <Pressable onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={24} color={styles.iconColor.color} />
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
                    styles.clientItem,
                    isSelected && styles.clientItemSelected,
                    pressed && styles.clientItemPressed,
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.clientItemText,
                      isSelected && styles.clientItemTextSelected,
                    ]}
                  >
                    {item.nombre}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={styles.checkColor.color} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        backdrop: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.overlay,
        },
        content: {
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: theme.radii.large,
          borderTopRightRadius: theme.radii.large,
          maxHeight: '60%',
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        title: {
          color: theme.colors.text,
          fontSize: theme.typography.size.lg,
          fontWeight: theme.typography.weight.bold,
        },
        close: {
          padding: 4,
        },
        iconColor: {
          color: theme.colors.text,
        },
        checkColor: {
          color: theme.colors.primary,
        },
        clientItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.surfaceSubtle,
        },
        clientItemSelected: {
          backgroundColor: theme.colors.primaryLight,
        },
        clientItemPressed: {
          backgroundColor: theme.colors.surfaceMuted,
        },
        clientItemText: {
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.medium,
        },
        clientItemTextSelected: {
          color: theme.colors.primary,
          fontWeight: theme.typography.weight.bold,
        },
      }),
    [theme],
  );
};
