import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
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
import type { BillingCycle } from '../../../services/types';

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

const BILLING_OPTIONS: Array<{ value: BillingCycle; label: string }> = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
];

let nextId = 100;

function getDayLabel(dayOfWeek: number) {
  return DAY_OPTIONS.find((d) => d.value === dayOfWeek)?.short || 'Lun';
}

export function EditContractScreen({ clientId, onBack, onSave }: EditContractScreenProps) {
  const styles = useThemedStyles(createStyles);
  const client = MOCK_CLIENTS.find((c) => c.id === clientId);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(client?.billing_cycle || 'monthly');
  const [billingStartDate, setBillingStartDate] = useState(client?.billing_start_date || '2026-06-01');
  const [billingDay, setBillingDay] = useState(client?.billing_day?.toString() || '30');

  const [schedules, setSchedules] = useState<ScheduleRow[]>(() =>
    client?.schedules.map((s) => ({
      id: s.id,
      day_of_week: s.day_of_week,
      pickup_time: s.pickup_time,
      return_time: s.return_time || '',
    })) || [],
  );

  const [dayPickerFor, setDayPickerFor] = useState<string | null>(null);

  const handleAddSchedule = () => {
    nextId += 1;
    setSchedules([
      ...schedules,
      { id: String(nextId), day_of_week: 1, pickup_time: '', return_time: '' },
    ]);
  };

  const handleRemoveSchedule = (id: string) => {
    if (schedules.length <= 1) return;
    setSchedules(schedules.filter((s) => s.id !== id));
  };

  const handleScheduleChange = (id: string, field: keyof ScheduleRow, value: string | number) => {
    setSchedules(
      schedules.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const handleSelectDay = (dayValue: number) => {
    if (dayPickerFor) {
      handleScheduleChange(dayPickerFor, 'day_of_week', dayValue);
    }
    setDayPickerFor(null);
  };

  if (!client) {
    return (
      <ScreenWrapper title="Editar contrato" onBackPress={onBack}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Cliente no encontrado</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Editar contrato" onBackPress={onBack}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facturación</Text>
          <View style={styles.radioGroup}>
            {BILLING_OPTIONS.map((option) => {
              const isSelected = billingCycle === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.radioOption, isSelected && styles.radioOptionSelected]}
                  onPress={() => setBillingCycle(option.value)}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Inicio de ciclo</Text>
              <TextInput
                style={styles.input}
                value={billingStartDate}
                onChangeText={setBillingStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={styles.placeholderColor.color}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Día de cierre</Text>
              <TextInput
                style={styles.input}
                value={billingDay}
                onChangeText={setBillingDay}
                placeholder="30"
                placeholderTextColor={styles.placeholderColor.color}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horarios habituales</Text>

          <View style={styles.tableHeader}>
            <Text style={[styles.colLabel, styles.colLabelDay]}>Día</Text>
            <Text style={[styles.colLabel, styles.colLabelTime]}>Ida</Text>
            <Text style={[styles.colLabel, styles.colLabelTime]}>Vuelta</Text>
            <View style={styles.colLabelDelete} />
          </View>

          {schedules.map((schedule) => (
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
          ))}

          <Pressable
            style={({ pressed }) => [styles.addScheduleRow, pressed && styles.addScheduleRowPressed]}
            onPress={handleAddSchedule}
          >
            <View style={styles.addScheduleIcon}>
              <AppIcon name="plus" size={15} color={styles.addActionColor.color} />
            </View>
            <Text style={styles.addScheduleLabel}>Agregar horario</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            onPress={onSave}
          >
            <AppIcon name="check" size={18} color={styles.primaryButtonText.color} />
            <Text style={styles.primaryButtonText}>Guardar cambios</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
            onPress={onBack}
          >
            <Text style={styles.outlineButtonText}>Cancelar</Text>
          </Pressable>
        </View>
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
            {DAY_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.modalOption,
                  dayPickerFor && schedules.find((s) => s.id === dayPickerFor)?.day_of_week === option.value
                    && styles.modalOptionSelected,
                  pressed && styles.modalOptionPressed,
                ]}
                onPress={() => handleSelectDay(option.value)}
              >
                <Text style={[
                  styles.modalOptionText,
                  dayPickerFor && schedules.find((s) => s.id === dayPickerFor)?.day_of_week === option.value
                    && styles.modalOptionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
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
      paddingTop: 16,
      paddingBottom: 40,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 14,
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      marginHorizontal: 16,
      marginBottom: 12,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSubtle,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 10,
    },
    radioGroup: {
      paddingHorizontal: 18,
      paddingBottom: 14,
      gap: 6,
    },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    radioOptionSelected: {
      backgroundColor: theme.colors.primaryLight,
      borderColor: theme.colors.primary,
    },
    radioCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: theme.colors.disabled,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    radioDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.colors.primaryLight,
    },
    radioLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textMuted,
    },
    radioLabelSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    twoCol: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 18,
      paddingBottom: 12,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
      paddingTop: 10,
    },
    col: {
      flex: 1,
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSubtle,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    input: {
      backgroundColor: theme.colors.background,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.text,
    },
    placeholderColor: {
      color: theme.colors.textSubtle,
    },
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingBottom: 8,
    },
    colLabel: {
      fontSize: 10,
      fontWeight: '700',
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
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    daySelectPressed: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryLight,
    },
    daySelectText: {
      fontSize: 12,
      color: theme.colors.text,
      fontWeight: '600',
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
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 6,
      fontSize: 13,
      color: theme.colors.text,
      textAlign: 'center',
      fontWeight: '500',
    },
    deleteButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(192,57,43,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonPressed: {
      backgroundColor: 'rgba(192,57,43,0.15)',
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
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    addActionColor: {
      color: theme.colors.primary,
    },
    actions: {
      padding: 16,
      gap: 8,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 13,
    },
    primaryButtonPressed: {
      opacity: 0.9,
    },
    primaryButtonText: {
      color: theme.colors.primaryLight,
      fontSize: 14,
      fontWeight: '600',
    },
    outlineButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderRadius: 12,
      paddingVertical: 13,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    },
    outlineButtonPressed: {
      opacity: 0.85,
    },
    outlineButtonText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
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
      borderRadius: 16,
      paddingVertical: 8,
      paddingHorizontal: 8,
      width: 260,
      maxHeight: 380,
    },
    modalTitle: {
      fontSize: 14,
      fontWeight: '700',
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
      borderRadius: 10,
    },
    modalOptionSelected: {
      backgroundColor: theme.colors.primaryLight,
    },
    modalOptionPressed: {
      backgroundColor: theme.colors.background,
    },
    modalOptionText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '500',
    },
    modalOptionTextSelected: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
  });
