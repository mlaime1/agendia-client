import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ConfirmSummaryPaymentDto, PaymentMethod } from '../../../services/types';
import { useFeedback } from '../../../state/FeedbackContext';
import { Theme, useThemedStyles } from '../../../theme';

type PaymentConfirmationModalProps = {
  visible: boolean;
  maxAmount: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: (payment: ConfirmSummaryPaymentDto) => Promise<void>;
};

const methods: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'debit', label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
  { value: 'other', label: 'Otro' },
];

export function PaymentConfirmationModal({ visible, maxAmount, loading, onClose, onConfirm }: PaymentConfirmationModalProps) {
  const styles = useThemedStyles(createStyles);
  const { showFeedback } = useFeedback();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount('');
      setMethod('cash');
      setNotes('');
    }
  }, [visible]);

  const handleConfirm = async () => {
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      showFeedback({ type: 'error', message: 'El monto debe ser mayor que cero.' });
      return;
    }
    if (parsedAmount > maxAmount) {
      showFeedback({ type: 'error', message: `El monto no puede superar el saldo de $${maxAmount.toFixed(2)}.` });
      return;
    }

    try {
      await onConfirm({ amount: parsedAmount, method, ...(notes.trim() ? { notes: notes.trim() } : {}) });
    } catch {
      // The action hook already displays the API error; keep the form open for retry.
    }
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={loading ? undefined : onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.title}>Confirmar pago</Text>
          <Text style={styles.label}>Monto (saldo máximo ${maxAmount.toFixed(2)})</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={styles.placeholder.color}
            keyboardType="decimal-pad"
            editable={!loading}
            style={styles.input}
          />
          <Text style={styles.label}>Método de pago</Text>
          <View style={styles.methodList}>
            {methods.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setMethod(option.value)}
                disabled={loading}
                style={[styles.method, method === option.value && styles.methodSelected]}
              >
                <Text style={[styles.methodText, method === option.value && styles.methodTextSelected]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>Notas (opcional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Opcional"
            placeholderTextColor={styles.placeholder.color}
            editable={!loading}
            style={[styles.input, styles.notesInput]}
            multiline
          />
          <View style={styles.actions}>
            <Pressable onPress={onClose} disabled={loading} style={[styles.actionButton, styles.secondaryButton]}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} disabled={loading} style={[styles.actionButton, styles.primaryButton, loading && styles.disabledButton]}>
              <Text style={styles.primaryText}>{loading ? 'Confirmando...' : 'Confirmar'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay },
  panel: { padding: 20, paddingBottom: 28, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: theme.colors.surface },
  title: { marginBottom: 18, color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  label: { marginBottom: 6, color: theme.colors.textMuted, fontSize: 12, fontWeight: '800' },
  input: { minHeight: 44, marginBottom: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: 8, color: theme.colors.text, backgroundColor: theme.colors.surfaceSubtle },
  notesInput: { minHeight: 68, paddingTop: 10, textAlignVertical: 'top' },
  placeholder: { color: theme.colors.textSubtle },
  methodList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  method: { paddingHorizontal: 10, paddingVertical: 9, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.small, backgroundColor: theme.colors.surfaceMuted },
  methodSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  methodText: { color: theme.colors.textMuted, fontSize: theme.typography.size.sm },
  methodTextSelected: { color: theme.colors.textInverse, fontWeight: theme.typography.weight.semibold },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  secondaryButton: { backgroundColor: theme.colors.surfaceMuted },
  primaryButton: { backgroundColor: theme.colors.primary },
  disabledButton: { backgroundColor: theme.colors.disabled },
  secondaryText: { color: theme.colors.textMuted, fontWeight: '800' },
  primaryText: { color: theme.colors.textInverse, fontWeight: '800' },
});
