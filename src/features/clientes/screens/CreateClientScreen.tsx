import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormActions } from '../../../components/FormActions';
import { FormField } from '../../../components/FormField';
import { RadioGroup } from '../../../components/RadioGroup';
import { FormSection } from '../../../components/FormSection';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme } from '../../../theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { useFeedback } from '../../../state/FeedbackContext';
import { clientsService } from '../../../services/clients';
import type { BillingCycle } from '../../../services/types';

const BILLING_OPTIONS: Array<{ value: BillingCycle; label: string; description: string }> = [
  { value: 'weekly', label: 'Semanal', description: 'Corta cada semana cerrada' },
  { value: 'biweekly', label: 'Quincenal', description: 'Corta cada 14 días cerrados' },
  { value: 'monthly', label: 'Mensual', description: 'Corta por mes calendario cerrado' },
];

const normalizeDateInput = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parts = trimmed.split('/');
  if (parts.length !== 3) return '';

  const [day, month, year] = parts;
  if (!day || !month || !year) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const toDigits = (value: string): string => value.replace(/\D/g, '');

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'A';
}

type CreateClientScreenProps = {
  onBack: () => void;
  onClientCreated: (clientId: string) => void;
};

export function CreateClientScreen({ onBack, onClientCreated }: CreateClientScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { showFeedback } = useFeedback();

  const [nombre, setNombre] = useState('');
  const [phone, setPhone] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [billingDay, setBillingDay] = useState('');
  const [billingStartDate, setBillingStartDate] = useState('');
  const [saving, setSaving] = useState(false);

  const initial = useMemo(() => getInitial(nombre), [nombre]);

  const handlePhoneChange = useCallback((value: string) => {
    setPhone(toDigits(value));
  }, []);

  const validate = useCallback((): string | null => {
    if (!nombre.trim()) {
      return 'El nombre es obligatorio.';
    }
    if (!phone.trim()) {
      return 'El teléfono es obligatorio.';
    }

    if (billingCycle === 'weekly' || billingCycle === 'monthly') {
      const day = Number.parseInt(billingDay, 10);
      if (Number.isNaN(day)) {
        return 'El día de corte es obligatorio.';
      }
      if (billingCycle === 'weekly' && (day < 1 || day > 7)) {
        return 'El día de corte semanal debe estar entre 1 (lunes) y 7 (domingo).';
      }
      if (billingCycle === 'monthly' && (day < 1 || day > 31)) {
        return 'El día de corte mensual debe estar entre 1 y 31.';
      }
    }

    if (billingCycle === 'biweekly') {
      const normalized = normalizeDateInput(billingStartDate);
      if (!normalized) {
        return 'La fecha de inicio del ciclo quincenal es obligatoria.';
      }
    }

    return null;
  }, [nombre, phone, billingCycle, billingDay, billingStartDate]);

  const handleSave = useCallback(async () => {
    const error = validate();
    if (error) {
      showFeedback({ type: 'error', message: error });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        phone: phone.trim(),
        billing_cycle: billingCycle,
        billing_day:
          billingCycle === 'weekly' || billingCycle === 'monthly'
            ? Number.parseInt(billingDay, 10)
            : undefined,
        billing_start_date:
          billingCycle === 'biweekly' ? normalizeDateInput(billingStartDate) : undefined,
      };

      const newClient = await clientsService.create(payload);
      showFeedback({ type: 'success', message: 'Cliente creado correctamente.' });
      onClientCreated(newClient.id);
    } catch (saveError) {
      showFeedback({
        type: 'error',
        message: saveError instanceof Error ? saveError.message : 'No se pudo crear el cliente.',
      });
    } finally {
      setSaving(false);
    }
  }, [validate, nombre, phone, billingCycle, billingDay, billingStartDate, showFeedback, onClientCreated]);

  const cycleHint = useMemo(() => {
    if (billingCycle === 'weekly') return 'Día de corte semanal. 1 = lunes, 7 = domingo.';
    if (billingCycle === 'biweekly') return 'Fecha de inicio del primer ciclo quincenal.';
    return 'Día de corte mensual.';
  }, [billingCycle]);

  return (
    <ScreenWrapper title="Nuevo cliente" onBackPress={onBack}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.heroHint}>Cliente nuevo</Text>
        </View>

        <FormSection title="Datos personales">
          <FormField
            label="Nombre completo"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Andrea Gómez"
            autoCapitalize="words"
          />
          <FormField
            label="Teléfono"
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="Ej: 54115556677"
            keyboardType="number-pad"
            maxLength={15}
          />
        </FormSection>

        <FormSection title="Facturación">
          <RadioGroup
            options={BILLING_OPTIONS}
            selectedValue={billingCycle}
            onSelect={setBillingCycle}
          />

          {billingCycle !== 'biweekly' ? (
            <FormField
              label="Día de corte"
              value={billingDay}
              onChangeText={setBillingDay}
              placeholder={billingCycle === 'weekly' ? '1' : '30'}
              keyboardType="number-pad"
              maxLength={2}
            />
          ) : (
            <FormField
              label="Inicio de ciclo"
              value={billingStartDate}
              onChangeText={setBillingStartDate}
              placeholder="YYYY-MM-DD"
              keyboardType="default"
              maxLength={10}
            />
          )}

          <View style={styles.hintBox}>
            <Text style={styles.hintText}>{cycleHint}</Text>
          </View>
        </FormSection>

        <FormActions
          primaryLabel="Guardar cliente"
          onPrimary={handleSave}
          secondaryLabel="Cancelar"
          onSecondary={onBack}
          primaryLoading={saving}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingTop: 10,
      paddingBottom: 40,
    },
    hero: {
      alignItems: 'center',
      paddingVertical: 22,
      paddingHorizontal: 20,
    },
    avatar: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.textInverse,
    },
    heroHint: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.textSubtle,
      fontWeight: theme.typography.weight.medium,
    },
    hintBox: {
      paddingHorizontal: 18,
      paddingBottom: 14,
    },
    hintText: {
      fontSize: theme.typography.size.xs,
      color: theme.colors.textSubtle,
      lineHeight: 17,
    },
  });
