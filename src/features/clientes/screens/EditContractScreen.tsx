import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '../../../components/AppIcon';
import { FormActions } from '../../../components/FormActions';
import { FormField } from '../../../components/FormField';
import { RadioGroup } from '../../../components/RadioGroup';
import { FormSection } from '../../../components/FormSection';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme } from '../../../theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { useFeedback } from '../../../state/FeedbackContext';
import { useClientDetail, useClientSchedules } from '../hooks';
import type { BillingCycle, CreateScheduleDto } from '../../../services/types';
import { formatClientDate, getClientTimezone } from '../../../utils/dateTime';

type EditContractScreenProps = {
  clientId: string;
  onBack: () => void;
  onSave: () => void;
};

type ScheduleRow = {
  id: string;
  day_of_week: number;
  pickup_time: string;
  return_time: string;
};

const DAY_OPTIONS = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 7, label: 'Domingo', short: 'Dom' },
];

const BILLING_OPTIONS: Array<{ value: BillingCycle; label: string; description: string }> = [
  { value: 'weekly', label: 'Semanal', description: 'Corta cada semana cerrada' },
  { value: 'biweekly', label: 'Quincenal', description: 'Corta cada 14 días cerrados' },
  { value: 'monthly', label: 'Mensual', description: 'Corta por mes calendario cerrado' },
];

let nextTempId = 100;

function getDayLabel(dayOfWeek: number) {
  return DAY_OPTIONS.find((d) => d.value === dayOfWeek)?.short || 'Lun';
}

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

const isValidTime = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

export function EditContractScreen({ clientId, onBack, onSave }: EditContractScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { showFeedback } = useFeedback();
  const { client, loading, error, updateBilling } = useClientDetail(clientId);
  const { schedules, loading: loadingSchedules, bulkReplace } = useClientSchedules(clientId);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [billingStartDate, setBillingStartDate] = useState('');
  const [billingDay, setBillingDay] = useState('');
  const [localSchedules, setLocalSchedules] = useState<ScheduleRow[]>([]);
  const [dayPickerFor, setDayPickerFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const clientTimezone = getClientTimezone(client);

  useEffect(() => {
    if (client) {
      setBillingCycle(client.billing_cycle);
      setBillingDay(client.billing_day?.toString() ?? '');
      setBillingStartDate(client.billing_start_date ?? '');
    }
  }, [client]);

  useEffect(() => {
    setLocalSchedules(
      schedules.map((s) => ({
        id: s.id,
        day_of_week: s.day_of_week,
        pickup_time: s.pickup_time,
        return_time: s.return_time || '',
      })),
    );
  }, [schedules]);

  const handleAddSchedule = useCallback(() => {
    nextTempId += 1;
    setLocalSchedules((prev) => [
      ...prev,
      { id: `temp-${nextTempId}`, day_of_week: 1, pickup_time: '', return_time: '' },
    ]);
  }, []);

  const handleRemoveSchedule = useCallback((id: string) => {
    setLocalSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleScheduleChange = useCallback(
    (id: string, field: keyof ScheduleRow, value: string | number) => {
      setLocalSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    },
    [],
  );

  const handleSelectDay = useCallback(
    (dayValue: number) => {
      if (dayPickerFor) {
        handleScheduleChange(dayPickerFor, 'day_of_week', dayValue);
      }
      setDayPickerFor(null);
    },
    [dayPickerFor, handleScheduleChange],
  );

  const validate = useCallback((): string | null => {
    if (billingCycle === 'biweekly' && !normalizeDateInput(billingStartDate)) {
      return 'Ingresá la fecha de inicio del ciclo quincenal.';
    }
    if (billingCycle === 'weekly' || billingCycle === 'monthly') {
      const day = Number.parseInt(billingDay, 10);
      if (Number.isNaN(day)) return 'Ingresá el día de corte.';
      if (billingCycle === 'weekly' && (day < 1 || day > 7)) {
        return 'El día de corte semanal debe estar entre 1 y 7.';
      }
      if (billingCycle === 'monthly' && (day < 1 || day > 31)) {
        return 'El día de corte mensual debe estar entre 1 y 31.';
      }
    }

    for (const schedule of localSchedules) {
      if (!isValidTime(schedule.pickup_time)) {
        return `La hora de ida del ${getDayLabel(schedule.day_of_week)} no es válida (HH:mm).`;
      }
      if (schedule.return_time && !isValidTime(schedule.return_time)) {
        return `La hora de vuelta del ${getDayLabel(schedule.day_of_week)} no es válida (HH:mm).`;
      }
    }

    return null;
  }, [billingCycle, billingStartDate, billingDay, localSchedules]);

  const handleSave = useCallback(async () => {
    if (!client || saving) return;

    const validationError = validate();
    if (validationError) {
      showFeedback({ type: 'error', message: validationError });
      return;
    }

    setSaving(true);
    try {
      await updateBilling({
        billing_cycle: billingCycle,
        billing_day:
          billingCycle === 'weekly' || billingCycle === 'monthly'
            ? Number.parseInt(billingDay, 10)
            : undefined,
        billing_start_date:
          billingCycle === 'biweekly' ? normalizeDateInput(billingStartDate) : undefined,
      });

      const schedulesPayload: CreateScheduleDto[] = localSchedules.map((s) => ({
        day_of_week: s.day_of_week,
        pickup_time: s.pickup_time,
        return_time: s.return_time || null,
        label: null,
        is_active: true,
      }));

      await bulkReplace(schedulesPayload);

      showFeedback({ type: 'success', message: 'Contrato actualizado correctamente.' });
      onSave();
    } catch (saveError) {
      showFeedback({
        type: 'error',
        message: saveError instanceof Error ? saveError.message : 'No se pudo actualizar el contrato.',
      });
    } finally {
      setSaving(false);
    }
  }, [
    client,
    saving,
    validate,
    billingCycle,
    billingDay,
    billingStartDate,
    localSchedules,
    updateBilling,
    bulkReplace,
    showFeedback,
    onSave,
  ]);

  const billingStartDisplay = useMemo(() => {
    if (!client?.billing_start_date) return '';
    return formatClientDate(client.billing_start_date, clientTimezone);
  }, [client, clientTimezone]);

  if (loading) {
    return (
      <ScreenWrapper title="Editar contrato" onBackPress={onBack}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={styles.loadingColor.color} />
          <Text style={styles.loadingText}>Cargando contrato...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !client) {
    return (
      <ScreenWrapper title="Editar contrato" onBackPress={onBack}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Cliente no encontrado'}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Editar contrato" onBackPress={onBack}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroName}>{client.nombre}</Text>
          {billingStartDisplay ? (
            <Text style={styles.heroMeta}>Inicio actual: {billingStartDisplay}</Text>
          ) : null}
        </View>

        <FormSection title="Facturación">
          <RadioGroup
            options={BILLING_OPTIONS}
            selectedValue={billingCycle}
            onSelect={setBillingCycle}
          />

          <View style={styles.twoCol}>
            <View style={styles.col}>
              {billingCycle === 'biweekly' ? (
                <FormField
                  label="Inicio de ciclo"
                  value={billingStartDate}
                  onChangeText={setBillingStartDate}
                  placeholder="YYYY-MM-DD"
                />
              ) : (
                <FormField
                  label="Día de cierre"
                  value={billingDay}
                  onChangeText={setBillingDay}
                  placeholder={billingCycle === 'weekly' ? '1' : '30'}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              )}
            </View>
            <View style={styles.col} />
          </View>
        </FormSection>

        <FormSection title="Horarios habituales">
          <View style={styles.tableHeader}>
            <Text style={[styles.colLabel, styles.colLabelDay]}>Día</Text>
            <Text style={[styles.colLabel, styles.colLabelTime]}>Ida</Text>
            <Text style={[styles.colLabel, styles.colLabelTime]}>Vuelta</Text>
            <View style={styles.colLabelDelete} />
          </View>

          {loadingSchedules ? (
            <View style={styles.scheduleLoading}>
              <ActivityIndicator size="small" color={styles.loadingColor.color} />
              <Text style={styles.scheduleLoadingText}>Cargando horarios...</Text>
            </View>
          ) : (
            localSchedules.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleRow}>
                <Pressable
                  style={({ pressed }) => [styles.daySelect, pressed && styles.daySelectPressed]}
                  onPress={() => setDayPickerFor(schedule.id)}
                >
                  <Text style={styles.daySelectText}>{getDayLabel(schedule.day_of_week)}</Text>
                  <AppIcon name="chevronDown" size={12} color={styles.chevronColor.color} />
                </Pressable>

                <View style={styles.timeInputWrap}>
                  <TextInput
                    style={styles.timeInput}
                    value={schedule.pickup_time}
                    onChangeText={(val) => handleScheduleChange(schedule.id, 'pickup_time', val)}
                    placeholder="HH:mm"
                    placeholderTextColor={styles.placeholderColor.color}
                    maxLength={5}
                  />
                </View>

                <View style={styles.timeInputWrap}>
                  <TextInput
                    style={styles.timeInput}
                    value={schedule.return_time}
                    onChangeText={(val) => handleScheduleChange(schedule.id, 'return_time', val)}
                    placeholder="—"
                    placeholderTextColor={styles.placeholderColor.color}
                    maxLength={5}
                  />
                </View>

                <Pressable
                  style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
                  onPress={() => handleRemoveSchedule(schedule.id)}
                >
                  <AppIcon name="trash" size={15} color={styles.deleteIconColor.color} />
                </Pressable>
              </View>
            ))
          )}

          <Pressable
            style={({ pressed }) => [styles.addScheduleRow, pressed && styles.addScheduleRowPressed]}
            onPress={handleAddSchedule}
          >
            <View style={styles.addScheduleIcon}>
              <AppIcon name="plus" size={15} color={styles.addActionColor.color} />
            </View>
            <Text style={styles.addScheduleLabel}>Agregar horario</Text>
          </Pressable>
        </FormSection>

        <FormActions
          primaryLabel="Guardar cambios"
          onPrimary={handleSave}
          secondaryLabel="Cancelar"
          onSecondary={onBack}
          primaryLoading={saving}
        />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={dayPickerFor !== null}
        onRequestClose={() => setDayPickerFor(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setDayPickerFor(null)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar día</Text>
            {DAY_OPTIONS.map((option) => {
              const selected =
                dayPickerFor &&
                localSchedules.find((s) => s.id === dayPickerFor)?.day_of_week === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.modalOption,
                    selected && styles.modalOptionSelected,
                    pressed && styles.modalOptionPressed,
                  ]}
                  onPress={() => handleSelectDay(option.value)}
                >
                  <Text
                    style={[styles.modalOptionText, selected && styles.modalOptionTextSelected]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
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
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      gap: 12,
    },
    loadingColor: {
      color: theme.colors.primary,
    },
    loadingText: {
      fontSize: theme.typography.size.md,
      color: theme.colors.textSubtle,
      fontWeight: theme.typography.weight.medium,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: theme.typography.size.md,
    },
    hero: {
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    heroName: {
      fontSize: theme.typography.size.lg,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.text,
      marginBottom: 4,
    },
    heroMeta: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.textSubtle,
    },
    twoCol: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 18,
      paddingBottom: 12,
    },
    col: {
      flex: 1,
    },
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingBottom: 8,
    },
    colLabel: {
      fontSize: 10,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.disabled,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    colLabelDay: {
      width: 82,
    },
    colLabelTime: {
      flex: 1,
      textAlign: 'center',
    },
    colLabelDelete: {
      width: 32,
    },
    scheduleLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    scheduleLoadingText: {
      fontSize: theme.typography.size.sm,
      color: theme.colors.textSubtle,
    },
    scheduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingVertical: 6,
      gap: 8,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    daySelect: {
      width: 82,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.background,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.small,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    daySelectPressed: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
    },
    daySelectText: {
      fontSize: theme.typography.size.md,
      color: theme.colors.text,
      fontWeight: theme.typography.weight.semibold,
    },
    chevronColor: {
      color: theme.colors.textSubtle,
    },
    timeInputWrap: {
      flex: 1,
    },
    timeInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.small,
      paddingVertical: 8,
      paddingHorizontal: 6,
      fontSize: theme.typography.size.md,
      color: theme.colors.text,
      textAlign: 'center',
      fontWeight: theme.typography.weight.medium,
    },
    placeholderColor: {
      color: theme.colors.textSubtle,
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: theme.radii.small,
      backgroundColor: 'rgba(180,35,24,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonPressed: {
      backgroundColor: 'rgba(180,35,24,0.15)',
    },
    deleteIconColor: {
      color: theme.colors.danger,
    },
    addScheduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    addScheduleRowPressed: {
      opacity: 0.7,
    },
    addScheduleIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addScheduleLabel: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.semibold,
      color: theme.colors.primary,
    },
    addActionColor: {
      color: theme.colors.primary,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.medium,
      paddingVertical: 8,
      paddingHorizontal: 8,
      width: 260,
      maxHeight: 380,
    },
    modalTitle: {
      fontSize: theme.typography.size.md,
      fontWeight: theme.typography.weight.bold,
      color: theme.colors.text,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
      marginBottom: 4,
    },
    modalOption: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: theme.radii.small,
    },
    modalOptionSelected: {
      backgroundColor: theme.colors.primaryLight,
    },
    modalOptionPressed: {
      backgroundColor: theme.colors.background,
    },
    modalOptionText: {
      fontSize: theme.typography.size.md,
      color: theme.colors.text,
      fontWeight: theme.typography.weight.medium,
    },
    modalOptionTextSelected: {
      color: theme.colors.primary,
      fontWeight: theme.typography.weight.bold,
    },
  });
