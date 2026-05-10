import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type SpecialTripModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (specialType: string, note: string) => void;
};

export function SpecialTripModal({ visible, onClose, onConfirm }: SpecialTripModalProps) {
  const [specialType, setSpecialType] = useState('Extra stop');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      setSpecialType('Extra stop');
      setNote('');
    }
  }, [visible]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.title}>Special trip</Text>

          <Text style={styles.label}>Trip type</Text>
          <TextInput
            onChangeText={setSpecialType}
            placeholder="Extra stop, detour..."
            style={styles.input}
            value={specialType}
          />

          <Text style={styles.label}>Note</Text>
          <TextInput
            multiline
            onChangeText={setNote}
            placeholder="Optional"
            style={[styles.input, styles.noteInput]}
            value={note}
          />

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.actionButton, styles.secondaryButton]}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirm(specialType, note)}
              style={[styles.actionButton, styles.primaryButton]}
            >
              <Text style={styles.primaryText}>Add trip</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(28, 39, 30, 0.28)',
  },
  panel: {
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  title: {
    marginBottom: 18,
    color: '#253229',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0,
  },
  label: {
    marginBottom: 6,
    color: '#59675D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  input: {
    minHeight: 44,
    marginBottom: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DDE7DF',
    borderRadius: 8,
    color: '#253229',
    backgroundColor: '#F8FBF8',
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
    backgroundColor: '#EFF4F0',
  },
  primaryButton: {
    backgroundColor: '#2F8A55',
  },
  secondaryText: {
    color: '#526057',
    fontWeight: '800',
    letterSpacing: 0,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0,
  },
});
