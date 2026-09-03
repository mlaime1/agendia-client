import React, { useEffect, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme';
import { clientsService } from '../../../services/clients';
import { api } from '../../../services/backendApi';
import type { BillingPreview, Client } from '../../../services/types';
import {
  formatClientPeriod,
  getClientTimezone,
  getClientToday,
  getClientLongDateLabelFromDate,
  toDateKey,
  isSameDay,
} from '../../../utils/dateTime';
import { summariesService } from '../../../services/summaries';
import { useCreateSummary } from '../hooks/useCreateSummary';
import { useManualTripCount } from '../hooks/useManualTripCount';
import { getErrorMessage } from '../../../utils/errorMessage';
import { useFeedback } from '../../../state/FeedbackContext';
import { ManualRangePicker } from './ManualRangePicker';
import { SummaryClientSelector } from './SummaryClientSelector';
import { getCycleLabel } from '../utils/summaryCycle';
import { useAuth } from '../../../state/AuthContext';
import { usePermissions } from '../../../permissions';
import { UnauthorizedScreen } from '../../../components/UnauthorizedScreen';
import { useClosedSummaryPeriods } from '../../../hooks/useClosedSummaryPeriods';
import { rangeIntersectsClosedSummary } from '../../../utils/summaryPeriods';

type CreateSummaryModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedClientId: string;
  driverId: string;
  clientTimezone?: string;
  onSuccess: () => void;
};

export function CreateSummaryModal({
  visible,
  onClose,
  selectedClientId,
  driverId,
  clientTimezone,
  onSuccess,
}: CreateSummaryModalProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { showFeedback } = useFeedback();
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const { creating, createManual, createAuto } = useCreateSummary();

  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [clients, setClients] = useState<Client[]>([]);
  const [numericDriverId, setNumericDriverId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState(selectedClientId);
  const [clientSelectorVisible, setClientSelectorVisible] = useState(false);

  const [preview, setPreview] = useState<BillingPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [manualMonthDate, setManualMonthDate] = useState(() => new Date());
  const [manualStartDate, setManualStartDate] = useState<Date | null>(null);
  const [manualEndDate, setManualEndDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');

  const effectiveTimezone = useMemo(
    () => clientTimezone ?? getClientTimezone(clients.find((c) => c.id === selectedClient)),
    [clientTimezone, clients, selectedClient],
  );

  const {
    periods: closedPeriods,
    loading: closedPeriodsLoading,
    error: closedPeriodsError,
    isDateClosed,
  } = useClosedSummaryPeriods(activeTab === 'manual' ? selectedClient : null, effectiveTimezone);

  const manualPeriodStart = useMemo(
    () => (manualStartDate ? toDateKey(manualStartDate, effectiveTimezone) : null),
    [manualStartDate, effectiveTimezone],
  );
  const manualPeriodEnd = useMemo(
    () => (manualEndDate ? toDateKey(manualEndDate, effectiveTimezone) : manualPeriodStart),
    [manualEndDate, manualPeriodStart, effectiveTimezone],
  );

  const { availableTrips, loading: countingTrips, error: countError } = useManualTripCount(
    activeTab === 'manual' ? selectedClient : null,
    manualPeriodStart,
    manualPeriodEnd,
  );

  useEffect(() => {
    if (!visible) return;

    const mountedRef = { current: true };
    setSelectedClient(selectedClientId);
    setActiveTab('auto');
    setManualMonthDate(getClientToday(effectiveTimezone));
    setManualStartDate(null);
    setManualEndDate(null);
    setNotes('');
    setPreview(null);
    setPreviewError(null);
    loadClients(mountedRef);

    return () => {
      mountedRef.current = false;
    };
  }, [visible, selectedClientId, effectiveTimezone]);

  useEffect(() => {
    if (!visible) return;

    let mounted = true;
    setNumericDriverId(null);

    (async () => {
      try {
        const profile = await api.get<{ id: string }>('/users/me');
        if (!mounted) return;
        if (profile?.id) {
          setNumericDriverId(String(profile.id));
        }
      } catch (err) {
        if (mounted) {
          showFeedback({ type: 'error', message: getErrorMessage(err, 'Error obteniendo perfil') });
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [visible, showFeedback]);

  useEffect(() => {
    if (!visible || !selectedClient || activeTab !== 'auto') {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    const controller = new AbortController();

    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreview(null);
      try {
        const data = await summariesService.preview(selectedClient);
        if (controller.signal.aborted) return;
        setPreview(data);
      } catch (err) {
        if (controller.signal.aborted) return;
        setPreviewError(getErrorMessage(err, 'Error cargando preview'));
      } finally {
        if (!controller.signal.aborted) {
          setPreviewLoading(false);
        }
      }
    };

    loadPreview();

    return () => controller.abort();
  }, [visible, selectedClient, activeTab]);

  const loadClients = async (mountedRef: { current: boolean }) => {
    try {
      const data = await clientsService.getAll();
      if (!mountedRef.current) return;
      setClients(data);
    } catch (err) {
      if (!mountedRef.current) return;
      showFeedback({ type: 'error', message: getErrorMessage(err, 'Error cargando clientes') });
    }
  };

  const selectManualDate = (date: Date) => {
    const dateKey = toDateKey(date, effectiveTimezone);
    if (isDateClosed(dateKey)) {
      showFeedback({ type: 'error', message: 'Esta fecha ya pertenece a un período cerrado y no se puede seleccionar.' });
      return;
    }

    if (!manualStartDate || (manualStartDate && manualEndDate)) {
      setManualStartDate(date);
      setManualEndDate(null);
      return;
    }

    if (isSameDay(date, manualStartDate, effectiveTimezone)) {
      setManualEndDate(date);
      return;
    }

    if (date.getTime() < manualStartDate.getTime()) {
      const startKey = dateKey;
      const endKey = toDateKey(manualStartDate, effectiveTimezone);
      if (rangeIntersectsClosedSummary(startKey, endKey, closedPeriods)) {
        showFeedback({ type: 'error', message: 'El rango incluye fechas de un período cerrado y no se puede seleccionar.' });
        return;
      }
      setManualEndDate(manualStartDate);
      setManualStartDate(date);
      return;
    }

    if (rangeIntersectsClosedSummary(toDateKey(manualStartDate, effectiveTimezone), dateKey, closedPeriods)) {
      showFeedback({ type: 'error', message: 'El rango incluye fechas de un período cerrado y no se puede seleccionar.' });
      return;
    }

    setManualEndDate(date);
  };

  const handleCreate = async () => {
    if (!selectedClient || creating) return;

    const sendingDriverId = numericDriverId ?? driverId;
    const trimmedNotes = notes.trim() || undefined;

    try {
      if (activeTab === 'auto') {
        if (!preview || preview.available_trips === 0) {
          showFeedback({ type: 'error', message: 'No hay viajes disponibles para el período automático' });
          return;
        }
        await createAuto(selectedClient, { driver_id: sendingDriverId, notes: trimmedNotes });
      } else {
        if (!manualPeriodStart || !manualPeriodEnd) {
          showFeedback({ type: 'error', message: 'Seleccioná un rango de fechas en el calendario' });
          return;
        }

        if (manualPeriodStart > manualPeriodEnd) {
          showFeedback({ type: 'error', message: 'La fecha desde no puede ser mayor que la fecha hasta' });
          return;
        }

        if (closedPeriodsLoading || closedPeriodsError || rangeIntersectsClosedSummary(manualPeriodStart, manualPeriodEnd, closedPeriods)) {
          showFeedback({
            type: 'error',
            message: closedPeriodsError || closedPeriodsLoading
              ? 'No se pudo verificar si las fechas están disponibles. Intentá nuevamente.'
              : 'El rango incluye fechas de un período cerrado y no se puede seleccionar.',
          });
          return;
        }

        if (availableTrips === 0) {
          showFeedback({ type: 'error', message: 'No hay viajes disponibles en el rango seleccionado' });
          return;
        }

        await createManual({
          client_id: selectedClient,
          driver_id: sendingDriverId,
          period_start: manualPeriodStart,
          period_end: manualPeriodEnd,
          period_type: 'manual',
          notes: trimmedNotes,
        });
      }

      onSuccess();
      onClose();
    } catch {
      // El error ya se muestra por useFeedback en el hook
    }
  };

  const formatPreviewPeriod = () => {
    if (!preview) return '';
    return formatClientPeriod(preview.period_start, preview.period_end, effectiveTimezone);
  };

  const selectedClientData = clients.find((c) => c.id === selectedClient);
  const canCreate = activeTab === 'auto'
    ? Boolean(preview && preview.available_trips > 0)
    : Boolean(manualPeriodStart && manualPeriodEnd && availableTrips > 0);

  if (!permissions.can.summaryManagement) {
    return <UnauthorizedScreen />;
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHandle} />

          <View style={styles.tabsRow}>
            <Pressable
              style={[styles.tab, activeTab === 'auto' && styles.tabActive]}
              onPress={() => setActiveTab('auto')}
            >
              <Text style={[styles.tabText, activeTab === 'auto' && styles.tabTextActive]}>
                Automático
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'manual' && styles.tabActive]}
              onPress={() => setActiveTab('manual')}
            >
              <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
                Manual
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Cliente</Text>
            <Pressable
              style={({ pressed }) => [styles.clientSelect, pressed && styles.clientSelectPressed]}
              onPress={() => setClientSelectorVisible(true)}
            >
              <Text style={styles.clientSelectText}>
                {selectedClientData?.nombre || 'Seleccionar cliente'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={styles.chevronColor.color} />
            </Pressable>

            {activeTab === 'manual' && (
              <>
                <ManualRangePicker
                  monthDate={manualMonthDate}
                  startDate={manualStartDate}
                  endDate={manualEndDate}
                  clientTimezone={effectiveTimezone}
                  onSelectDate={selectManualDate}
                  isDateClosed={isDateClosed}
                  onPrevMonth={() =>
                    setManualMonthDate(
                      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                    )
                  }
                  onNextMonth={() =>
                    setManualMonthDate(
                      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                    )
                  }
                  onClear={() => {
                    setManualStartDate(null);
                    setManualEndDate(null);
                  }}
                />
                {closedPeriods.length > 0 && (
                  <View style={styles.previewWarning}>
                    <Ionicons name="lock-closed-outline" size={16} color={styles.warningColor.color} />
                    <Text style={[styles.previewWarningText, { color: styles.warningColor.color }]}>
                      Las fechas de períodos abonados o archivados no se pueden seleccionar.
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.notesSection}>
              <Text style={styles.fieldLabel}>Notas</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Opcional"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            <View style={styles.previewCard}>
              {activeTab === 'auto' ? (
                <AutoPreview
                  loading={previewLoading}
                  error={previewError}
                  preview={preview}
                  formatPeriod={formatPreviewPeriod}
                />
              ) : (
                <ManualPreview
                  loading={countingTrips}
                  error={countError}
                  availableTrips={availableTrips}
                  periodStart={manualStartDate}
                  periodEnd={manualEndDate}
                  clientTimezone={effectiveTimezone}
                />
              )}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.confirmButtonPressed,
                (!canCreate || creating) && styles.confirmButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!canCreate || creating}
            >
              {creating ? (
                <ActivityIndicator color={styles.confirmButtonText.color} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Generar resumen</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <SummaryClientSelector
        visible={clientSelectorVisible}
        clients={clients}
        selectedClientId={selectedClient}
        onSelect={setSelectedClient}
        onClose={() => setClientSelectorVisible(false)}
      />
    </Modal>
  );
}

type AutoPreviewProps = {
  loading: boolean;
  error: string | null;
  preview: BillingPreview | null;
  formatPeriod: () => string;
};

function AutoPreview({ loading, error, preview, formatPeriod }: AutoPreviewProps) {
  const styles = useStyles();

  if (loading) {
    return <ActivityIndicator color={styles.activityColor.color} />;
  }

  if (error) {
    return (
      <View style={styles.previewWarning}>
        <Ionicons name="warning-outline" size={18} color={styles.warningColor.color} />
        <Text style={[styles.previewWarningText, { color: styles.warningColor.color }]}>{error}</Text>
      </View>
    );
  }

  if (preview) {
    return (
      <>
        <Text style={styles.previewTitle}>Vista previa</Text>
        <Text style={styles.previewPeriod}>{formatPeriod()}</Text>
        <Text style={styles.previewInfo}>
          Tipo de período: {getCycleLabel(preview.period_type)}
        </Text>
        <Text style={styles.previewInfo}>Viajes disponibles: {preview.available_trips}</Text>
        {preview.available_trips === 0 && (
          <Text style={[styles.previewWarningText, { color: styles.warningColor.color }]}>
            No hay viajes sin resumen para este período
          </Text>
        )}
      </>
    );
  }

  return (
    <Text style={styles.previewPlaceholder}>
      Seleccioná un cliente para ver la vista previa
    </Text>
  );
}

type ManualPreviewProps = {
  loading: boolean;
  error: string | null;
  availableTrips: number;
  periodStart: Date | null;
  periodEnd: Date | null;
  clientTimezone?: string;
};

function ManualPreview({
  loading,
  error,
  availableTrips,
  periodStart,
  periodEnd,
  clientTimezone,
}: ManualPreviewProps) {
  const styles = useStyles();

  if (loading) {
    return <ActivityIndicator color={styles.activityColor.color} />;
  }

  if (error) {
    return (
      <View style={styles.previewWarning}>
        <Ionicons name="warning-outline" size={18} color={styles.warningColor.color} />
        <Text style={[styles.previewWarningText, { color: styles.warningColor.color }]}>{error}</Text>
      </View>
    );
  }

  if (!periodStart || !periodEnd) {
    return (
      <Text style={styles.previewPlaceholder}>
        Seleccioná un rango de fechas para ver los viajes disponibles
      </Text>
    );
  }

  return (
    <>
      <Text style={styles.previewTitle}>Rango seleccionado</Text>
      <Text style={styles.previewPeriod}>
        {periodStart && getClientLongDateLabelFromDate(periodStart, clientTimezone)}
        {' — '}
        {periodEnd && getClientLongDateLabelFromDate(periodEnd, clientTimezone)}
      </Text>
      <Text style={styles.previewInfo}>Viajes disponibles: {availableTrips}</Text>
      {availableTrips === 0 && (
        <Text style={[styles.previewWarningText, { color: styles.warningColor.color }]}>
          No hay viajes sin resumen para este rango
        </Text>
      )}
    </>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
        modalOverlay: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        modalBackdrop: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.overlay,
        },
        modalContent: {
          backgroundColor: theme.colors.surface,
          borderTopLeftRadius: theme.radii.large,
          borderTopRightRadius: theme.radii.large,
          paddingHorizontal: 20,
          paddingTop: 12,
          maxHeight: '80%',
        },
        modalHandle: {
          width: 40,
          height: 4,
          backgroundColor: theme.colors.border,
          borderRadius: 2,
          alignSelf: 'center',
          marginBottom: 16,
        },
        tabsRow: {
          flexDirection: 'row',
          marginBottom: 20,
          gap: 8,
        },
        tab: {
          flex: 1,
          paddingVertical: 10,
          alignItems: 'center',
          borderRadius: theme.radii.small,
          backgroundColor: theme.colors.surfaceMuted,
        },
        tabActive: {
          backgroundColor: theme.colors.primary,
        },
        tabText: {
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
        },
        tabTextActive: {
          color: theme.colors.textInverse,
        },
        fieldLabel: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.bold,
          textTransform: 'uppercase',
          marginBottom: 6,
        },
        clientSelect: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginBottom: 16,
        },
        clientSelectPressed: {
          backgroundColor: theme.colors.surfaceMuted,
        },
        clientSelectText: {
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.medium,
        },
        chevronColor: {
          color: theme.colors.textSubtle,
        },
        notesSection: {
          marginBottom: 16,
        },
        notesInput: {
          minHeight: 88,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: theme.typography.size.md,
          color: theme.colors.text,
          textAlignVertical: 'top',
        },
        previewCard: {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.medium,
          padding: 16,
          marginBottom: 20,
          minHeight: 80,
          justifyContent: 'center',
        },
        previewTitle: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.bold,
          textTransform: 'uppercase',
          marginBottom: 4,
        },
        previewPeriod: {
          color: theme.colors.text,
          fontSize: theme.typography.size.lg,
          fontWeight: theme.typography.weight.bold,
        },
        previewInfo: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.sm,
          marginTop: 4,
        },
        previewPlaceholder: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.md,
          textAlign: 'center',
        },
        previewWarning: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        previewWarningText: {
          fontSize: theme.typography.size.sm,
          flex: 1,
        },
        warningColor: {
          color: theme.colors.semantic.warning.text,
        },
        activityColor: {
          color: theme.colors.primary,
        },
        modalActions: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 8,
        },
        cancelButton: {
          flex: 1,
          paddingVertical: 14,
          alignItems: 'center',
          borderRadius: theme.radii.medium,
          backgroundColor: theme.colors.surfaceMuted,
        },
        cancelButtonPressed: {
          opacity: 0.8,
        },
        cancelButtonText: {
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
        },
        confirmButton: {
          flex: 1,
          paddingVertical: 14,
          alignItems: 'center',
          borderRadius: theme.radii.medium,
          backgroundColor: theme.colors.primary,
        },
        confirmButtonPressed: {
          opacity: 0.9,
        },
        confirmButtonDisabled: {
          backgroundColor: theme.colors.disabled,
        },
        confirmButtonText: {
          color: theme.colors.textInverse,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
        },
      }),
    [theme],
  );
};
