import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Theme, useTheme, useThemedStyles } from '../../../theme';

type SpecialTripModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (specialType: string, note: string, price?: string) => void;
  canSetPrice?: boolean;
};

export function SpecialTripModal({ visible, onClose, onConfirm, canSetPrice = false }: SpecialTripModalProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [specialType, setSpecialType] = useState('Parada extra');
  const [note, setNote] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (visible) {
      setSpecialType('Parada extra');
      setNote('');
      setPrice('');
    }
  }, [visible]);

  const handleConfirm = () => {
    onConfirm(specialType, note, canSetPrice ? price : undefined);
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.title}>Viaje especial</Text>

          <Text style={styles.label}>Tipo de viaje</Text>
          <TextInput
            onChangeText={setSpecialType}
            placeholder="Parada extra, desvío..."
            placeholderTextColor={theme.colors.textSubtle}
            style={styles.input}
            value={specialType}
          />

          <Text style={styles.label}>Nota</Text>
          <TextInput
            multiline
            onChangeText={setNote}
            placeholder="Opcional"
            placeholderTextColor={theme.colors.textSubtle}
            style={[styles.input, styles.noteInput]}
            value={note}
          />

          {canSetPrice && (
            <>
              <Text style={styles.label}>Precio</Text>
              <TextInput
                inputMode="decimal"
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textSubtle}
                style={styles.input}
                value={price}
              />
            </>
          )}

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.actionButton, styles.secondaryButton]}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              style={[styles.actionButton, styles.primaryButton]}
            >
              <Text style={styles.primaryText}>Agregar viaje</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  panel: {
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: theme.colors.surface,
  },
  title: {
    marginBottom: 18,
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0,
  },
  label: {
    marginBottom: 6,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  input: {
    minHeight: 44,
    marginBottom: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 8,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  noteInput: {
    minHeight: 76,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryText: {
    color: theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0,
  },
  primaryText: {
    color: theme.colors.textInverse,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
