import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { clientsService } from '../../../services/clients';
import type { BillingCycle, Client } from '../../../services/types';
import { useFeedback } from '../../../state/FeedbackContext';
import { useAuth } from '../../../state/AuthContext';

type ClientesScreenProps = {
  selectedClientId: string;
  onMenuPress: () => void;
};

type BillingCycleInput = BillingCycle | 'Mensual' | 'Quincenal' | 'Semanal' | '';

const CYCLE_OPTIONS: Array<{ value: BillingCycle; label: string; description: string }> = [
  { value: 'weekly', label: 'Semanal', description: 'Corta cada semana cerrada' },
  { value: 'biweekly', label: 'Quincenal', description: 'Corta cada 14 días cerrados' },
  { value: 'monthly', label: 'Mensual', description: 'Corta por mes calendario cerrado' },
];

const normalizeBillingCycle = (value: BillingCycleInput): BillingCycle => {
  const normalized = value?.trim().toLowerCase();

  if (normalized === 'semanal') return 'weekly';
  if (normalized === 'quincenal') return 'biweekly';
  return 'monthly';
};

const getCycleLabel = (value: BillingCycleInput) => {
  const normalized = normalizeBillingCycle(value);
  return CYCLE_OPTIONS.find((option) => option.value === normalized)?.label ?? 'Mensual';
};

const normalizeDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parts = trimmed.split('/');
  if (parts.length !== 3) return '';

  const [day, month, year] = parts;
  if (!day || !month || !year) return '';

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

function formatBillingDay(value: number | null | undefined) {
  if (value == null) return 'Sin definir';
  return String(value);
}

export function ClientesScreen({ selectedClientId, onMenuPress }: ClientesScreenProps) {
  const insets = useSafeAreaInsets();
  const { showFeedback } = useFeedback();
  const { session } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [billingDay, setBillingDay] = useState('');
  const [billingStartDate, setBillingStartDate] = useState('');

  useEffect(() => {
    if (!selectedClientId) {
      setClient(null);
      setLoading(false);
      return;
    }

    const loadClient = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await clientsService.getById(selectedClientId, session?.access_token);
        setClient(data);

        const rawCycle = (data as Client & { billing_cycle: BillingCycleInput }).billing_cycle;
        const normalizedCycle = normalizeBillingCycle(rawCycle);
        setCycle(normalizedCycle);
        setBillingDay(data.billing_day?.toString() ?? '');
        setBillingStartDate(data.billing_start_date ?? '');
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Error cargando cliente');
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [selectedClientId, session?.access_token]);

  const clientName = client?.nombre || 'Cliente';

  const cycleHint = useMemo(() => {
    if (cycle === 'weekly') return 'Usa billing_day como día de corte semanal. Ejemplo: 1 = lunes.';
    if (cycle === 'biweekly') return 'Usa billing_start_date como ancla del ciclo quincenal.';
    return 'Usa billing_day como día de corte mensual. Ejemplo: 1 = primer día del mes.';
  }, [cycle]);

  const handleSave = async () => {
    if (!client || saving) return;

    if (cycle === 'biweekly' && !normalizeDateInput(billingStartDate)) {
      showFeedback({
        type: 'error',
        message: 'Ingresá billing_start_date en formato YYYY-MM-DD o DD/MM/YYYY.',
      });
      return;
    }

    if ((cycle === 'weekly' || cycle === 'monthly') && billingDay.trim()) {
      const dayNumber = Number.parseInt(billingDay, 10);
      if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) {
        showFeedback({
          type: 'error',
          message: 'billing_day debe estar entre 1 y 31.',
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        billing_cycle: cycle,
        billing_day:
          cycle === 'weekly' || cycle === 'monthly'
            ? (billingDay.trim() ? Number.parseInt(billingDay, 10) : undefined)
            : undefined,
        billing_start_date:
          cycle === 'biweekly'
            ? (normalizeDateInput(billingStartDate) || undefined)
            : undefined,
      };

      const updated = await clientsService.updateBilling(client.id, payload);
      setClient(updated);
      showFeedback({
        type: 'success',
        message: 'Ciclo de facturación actualizado correctamente.',
      });
    } catch (saveError) {
      showFeedback({
        type: 'error',
        message: saveError instanceof Error ? saveError.message : 'No se pudo actualizar el ciclo.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper title="Clientes" onMenuPress={onMenuPress}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#247145" size="large" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Cliente activo</Text>
              <Text style={styles.clientName}>{clientName}</Text>
              <Text style={styles.clientMeta}>ID {client?.id}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Ciclo de facturación</Text>
              <View style={styles.optionList}>
                {CYCLE_OPTIONS.map((option) => {
                  const isActive = cycle === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={({ pressed }) => [
                        styles.optionCard,
                        isActive && styles.optionCardActive,
                        pressed && styles.optionCardPressed,
                      ]}
                      onPress={() => setCycle(option.value)}
                    >
                      <View style={styles.optionHeaderRow}>
                        <Text style={[styles.optionTitle, isActive && styles.optionTitleActive]}>
                          {option.label}
                        </Text>
                        {isActive ? (
                          <Ionicons name="checkmark-circle" size={18} color="#247145" />
                        ) : null}
                      </View>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Valores actuales</Text>
              <Text style={styles.valueLine}>
                Ciclo actual: <Text style={styles.valueStrong}>{getCycleLabel((client as Client & { billing_cycle: BillingCycleInput })?.billing_cycle ?? cycle)}</Text>
              </Text>
              <Text style={styles.valueLine}>
                billing_day: <Text style={styles.valueStrong}>{formatBillingDay(client?.billing_day)}</Text>
              </Text>
              <Text style={styles.valueLine}>
                billing_start_date: <Text style={styles.valueStrong}>{client?.billing_start_date || 'Sin definir'}</Text>
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Configuración editable</Text>

              {(cycle === 'weekly' || cycle === 'monthly') && (
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>
                    billing_day {cycle === 'weekly' ? '(1 = lunes)' : '(1 = primer día del mes)'}
                  </Text>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={2}
                    onChangeText={setBillingDay}
                    placeholder="1"
                    style={styles.input}
                    value={billingDay}
                  />
                </View>
              )}

              {cycle === 'biweekly' && (
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>billing_start_date</Text>
                  <TextInput
                    autoCapitalize="none"
                    onChangeText={setBillingStartDate}
                    placeholder="YYYY-MM-DD"
                    style={styles.input}
                    value={billingStartDate}
                  />
                </View>
              )}

              <Text style={styles.hintText}>{cycleHint}</Text>
            </View>

            <Pressable
              disabled={saving}
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
                saving && styles.saveButtonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar ciclo</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE0',
    borderRadius: 14,
    padding: 14,
  },
  sectionLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  clientName: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '800',
  },
  clientMeta: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  optionList: {
    gap: 10,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: '#E8EDE0',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FAFAF7',
  },
  optionCardActive: {
    borderColor: '#247145',
    backgroundColor: '#EAF3DE',
  },
  optionCardPressed: {
    opacity: 0.85,
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitle: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
  },
  optionTitleActive: {
    color: '#247145',
  },
  optionDescription: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  valueLine: {
    color: '#4B5563',
    fontSize: 13,
    marginBottom: 4,
  },
  valueStrong: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D7E0D8',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#1A1A1A',
    fontSize: 14,
  },
  hintText: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
  },
  saveButton: {
    minHeight: 52,
    marginTop: 2,
    backgroundColor: '#247145',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonDisabled: {
    backgroundColor: '#A5B8AC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  errorText: {
    color: '#B42318',
    fontSize: 14,
    textAlign: 'center',
  },
});