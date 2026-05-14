import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
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

import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { summariesService } from '../../../services/summaries';
import { clientsService } from '../../../services/clients';
import type { Summary, SummaryStatus, Client, BillingPreview } from '../../../services/types';

type PeriodOption = '7dias' | '15dias' | 'mensual';

type ResumenesScreenProps = {
  selectedClientId: string;
  driverId: string;
  onMenuPress: () => void;
  onOpenDetail: (summaryId: string) => void;
};

const STATUS_CONFIG: Record<SummaryStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: '#FAEEDA', text: '#854F0B', label: 'Borrador' },
  sent: { bg: '#E6F1FB', text: '#185FA5', label: 'Enviado' },
  paid: { bg: '#EAF3DE', text: '#3B6D11', label: 'Abonado' },
  archived: { bg: '#F1EFE8', text: '#5F5E5A', label: 'Archivado' },
};

function parseDateKey(value: string) {
  return value.split('T')[0];
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

function formatPeriodLabel(start: string, end: string) {
  return `${formatDateLabel(parseDateKey(start))} — ${formatDateLabel(parseDateKey(end))}`;
}

function formatCurrency(value: string | number) {
  const amount = typeof value === 'number' ? value : parseFloat(value || '0');
  return amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

function getCycleLabel(periodType: Summary['period_type']) {
  if (periodType === 'weekly') return 'Semanal';
  if (periodType === 'biweekly') return 'Quincenal';
  return 'Mensual';
}

function getNextStatus(status: SummaryStatus): SummaryStatus | null {
  if (status === 'draft') return 'sent';
  if (status === 'sent') return 'paid';
  if (status === 'paid') return 'archived';
  return null;
}

function getStatusActionLabel(status: SummaryStatus) {
  if (status === 'draft') return 'Marcar como enviado';
  if (status === 'sent') return 'Marcar como abonado';
  if (status === 'paid') return 'Archivar';
  return null;
}

export function ResumenesScreen({
  selectedClientId,
  driverId,
  onMenuPress,
  onOpenDetail,
}: ResumenesScreenProps) {
  const insets = useSafeAreaInsets();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultPeriod, setDefaultPeriod] = useState<PeriodOption>('15dias');
  const [modalVisible, setModalVisible] = useState(false);

  const loadSummaries = useCallback(async () => {
    if (!selectedClientId) {
      setSummaries([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = await summariesService.getAllByClient(selectedClientId);
      const ordered = [...data].sort(
        (left, right) => new Date(right.period_end).getTime() - new Date(left.period_end).getTime(),
      );
      setSummaries(ordered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando resúmenes');
    } finally {
      setLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const handleStatusChange = (summary: Summary, newStatus: SummaryStatus) => {
    const actionLabel = getStatusActionLabel(newStatus);
    if (!actionLabel) return;

    Alert.alert('Confirmar cambio', `¿Quieres ${actionLabel.toLowerCase()} este resumen?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await summariesService.updateStatus(summary.id, { status: newStatus });
            loadSummaries();
          } catch (err) {
            console.error('Error updating status:', err);
          }
        },
      },
    ]);
  };

  const handleDownload = (id: string) => {
    const url = summariesService.getPdfUrl(id);
    Linking.openURL(url).catch((err) => {
      console.error('Error opening PDF:', err);
    });
  };

  const handleDelete = (summary: Summary) => {
    Alert.alert('Eliminar resumen', 'Esta acción solo se permite en borrador. ¿Deseas continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await summariesService.remove(summary.id);
            loadSummaries();
          } catch (err) {
            console.error('Error deleting summary:', err);
          }
        },
      },
    ]);
  };

  // Calculate stats
  const pendingCount = summaries.filter((s) => s.status === 'draft' || s.status === 'sent').length;
  const pendingAmount = summaries
    .filter((s) => s.status === 'draft' || s.status === 'sent')
    .reduce((acc, s) => acc + parseFloat(s.total_amount), 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthSummaries = summaries.filter((s) => {
    if (!s.paid_at) return false;
    const paidDate = new Date(s.paid_at);
    return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
  });
  const thisMonthAmount = thisMonthSummaries.reduce((acc, s) => acc + parseFloat(s.total_amount), 0);

  const renderSummaryItem = ({ item }: { item: Summary }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const period = formatPeriodLabel(item.period_start, item.period_end);
    const clientName = item.clients?.nombre || 'Cliente';
    const cycleLabel = getCycleLabel(item.period_type);
    const nextStatus = getNextStatus(item.status);

    return (
      <Pressable
        style={({ pressed }) => [styles.summaryCard, pressed && styles.summaryCardPressed]}
        onPress={() => onOpenDetail(item.id)}
      >
        <View style={styles.summaryTopRow}>
          <View style={styles.summaryLeftCol}>
            <Text style={styles.periodText}>{period}</Text>
            <Text style={styles.clientText}>{clientName}</Text>
          </View>
          <View style={styles.summaryRightCol}>
            <Text style={styles.amountText}>${formatCurrency(item.total_amount)}</Text>
            <Text style={styles.tripsText}>{item.total_trips} viajes</Text>
          </View>
        </View>

        <View style={styles.summaryBottomRow}>
          <View style={styles.actionButtons}>
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={() => onOpenDetail(item.id)}
            >
              <Ionicons name="eye-outline" size={16} color="#1A1A1A" />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
              onPress={() => handleDownload(item.id)}
            >
              <Ionicons name="download-outline" size={16} color="#1A1A1A" />
            </Pressable>

            {nextStatus && (
              <Pressable
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                onPress={() => handleStatusChange(item, nextStatus)}
              >
                <Ionicons
                  name={
                    nextStatus === 'sent'
                      ? 'send-outline'
                      : nextStatus === 'paid'
                        ? 'checkmark-circle-outline'
                        : 'archive-outline'
                  }
                  size={16}
                  color="#1A1A1A"
                />
              </Pressable>
            )}

            {item.status === 'draft' && (
              <Pressable
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                onPress={() => handleDelete(item)}
              >
                <Ionicons name="trash-outline" size={16} color="#B42318" />
              </Pressable>
            )}

            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.text }]} />
              <Text style={[styles.statusText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cycleBadgeRow}>
          <View style={styles.cycleBadge}>
            <Text style={styles.cycleBadgeText}>{cycleLabel}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenWrapper title="Resúmenes" onMenuPress={onMenuPress}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pendientes</Text>
            <Text style={styles.statValue}>${formatCurrency(pendingAmount)}</Text>
            <Text style={styles.statSubtitle}>{pendingCount} resúmenes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Este mes</Text>
            <Text style={styles.statValue}>${formatCurrency(thisMonthAmount)}</Text>
            <Text style={styles.statSubtitle}>{thisMonthSummaries.length} cobrados</Text>
          </View>
        </View>

        {/* Period selector */}
        <View style={styles.periodSection}>
          <Text style={styles.periodLabel}>PERÍODO POR DEFECTO</Text>
          <View style={styles.periodPills}>
            {(['7dias', '15dias', 'mensual'] as PeriodOption[]).map((period) => {
              const isActive = defaultPeriod === period;
              const label = period === '7dias' ? '7 días' : period === '15dias' ? '15 días' : 'Mensual';
              return (
                <Pressable
                  key={period}
                  style={[styles.periodPill, isActive && styles.periodPillActive]}
                  onPress={() => setDefaultPeriod(period)}
                >
                  <Text style={[styles.periodPillText, isActive && styles.periodPillTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Summary list */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#3A6B2A" size="large" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={loadSummaries}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : summaries.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No hay resúmenes</Text>
          </View>
        ) : (
          <FlatList
            data={summaries}
            keyExtractor={(item) => item.id}
            renderItem={renderSummaryItem}
            scrollEnabled={false}
            contentContainerStyle={styles.summaryList}
          />
        )}
      </ScrollView>

      {/* FAB */}
      <View style={[styles.fabContainer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabText}>+ Nuevo resumen</Text>
        </Pressable>
      </View>

      {/* New Summary Modal */}
      <NuevoResumenModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        selectedClientId={selectedClientId}
        driverId={driverId}
        defaultPeriod={defaultPeriod}
        onSuccess={() => {
          setModalVisible(false);
          loadSummaries();
        }}
      />
    </ScreenWrapper>
  );
}

// ============================================
// Nuevo Resumen Modal
// ============================================

type NuevoResumenModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedClientId: string;
  driverId: string;
  defaultPeriod: PeriodOption;
  onSuccess: () => void;
};

function NuevoResumenModal({
  visible,
  onClose,
  selectedClientId,
  driverId,
  defaultPeriod,
  onSuccess,
}: NuevoResumenModalProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState(selectedClientId);
  const [preview, setPreview] = useState<BillingPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState('');

  // Manual tab state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [clientSelectorVisible, setClientSelectorVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedClient(selectedClientId);
      setActiveTab('auto');
      setFromDate('');
      setToDate('');
      setNotes('');
      setPreview(null);
      setPreviewError(null);
      loadClients();
    }
  }, [visible, selectedClientId]);

  useEffect(() => {
    if (visible && selectedClient) {
      loadPreview();
    }
  }, [visible, selectedClient, activeTab, fromDate, toDate]);

  const loadClients = async () => {
    try {
      const data = await clientsService.getAll();
      setClients(data);
    } catch (err) {
      console.error('Error loading clients:', err);
    }
  };

  const loadPreview = async () => {
    if (!selectedClient) return;

    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);

    try {
      const data = await summariesService.preview(selectedClient);
      setPreview(data);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Error cargando preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const parseDateInput = (value: string) => {
    const [day, month, year] = value.split('/');
    if (!day || !month || !year) return null;

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleCreate = async () => {
    if (!selectedClient || creating) return;

    if (activeTab === 'manual') {
      const periodStart = parseDateInput(fromDate);
      const periodEnd = parseDateInput(toDate);

      if (!periodStart || !periodEnd) {
        setPreviewError('Ingresá un rango válido en formato DD/MM/YYYY');
        return;
      }

      if (periodStart > periodEnd) {
        setPreviewError('La fecha desde no puede ser mayor que la fecha hasta');
        return;
      }
    }

    setCreating(true);
    try {
      if (activeTab === 'auto') {
        await summariesService.createAuto(selectedClient, {
          driver_id: driverId,
          notes: notes.trim() || undefined,
        });
      } else {
        const periodStart = parseDateInput(fromDate);
        const periodEnd = parseDateInput(toDate);

        if (!periodStart || !periodEnd) {
          return;
        }

        await summariesService.createManual({
          client_id: selectedClient,
          driver_id: driverId,
          period_start: periodStart,
          period_end: periodEnd,
          notes: notes.trim() || undefined,
        });
      }
      onSuccess();
    } catch (err) {
      console.error('Error creating summary:', err);
    } finally {
      setCreating(false);
    }
  };

  const formatPreviewPeriod = () => {
    if (!preview) return '';
    return `${formatDateLabel(parseDateKey(preview.period_start))} → ${formatDateLabel(parseDateKey(preview.period_end))}`;
  };

  const selectedClientData = clients.find((c) => c.id === selectedClient);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHandle} />

          {/* Tabs */}
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
            {/* Client selector */}
            <Text style={styles.fieldLabel}>Cliente</Text>
            <Pressable
              style={({ pressed }) => [
                styles.clientSelect,
                pressed && styles.clientSelectPressed,
              ]}
              onPress={() => setClientSelectorVisible(true)}
            >
              <Text style={styles.clientSelectText}>
                {selectedClientData?.nombre || 'Seleccionar cliente'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#888888" />
            </Pressable>

            {/* Manual tab date pickers */}
            {activeTab === 'manual' && (
              <View style={styles.datePickerRow}>
                <View style={styles.datePickerField}>
                  <Text style={styles.fieldLabel}>Desde</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD/MM/YYYY"
                    value={fromDate}
                    onChangeText={setFromDate}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                <View style={styles.datePickerField}>
                  <Text style={styles.fieldLabel}>Hasta</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD/MM/YYYY"
                    value={toDate}
                    onChangeText={setToDate}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
              </View>
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

            {/* Preview card */}
            <View style={styles.previewCard}>
              {previewLoading ? (
                <ActivityIndicator color="#3A6B2A" />
              ) : previewError ? (
                <View style={styles.previewWarning}>
                  <Ionicons name="warning-outline" size={18} color="#854F0B" />
                  <Text style={styles.previewWarningText}>
                    {previewError}
                  </Text>
                </View>
              ) : preview ? (
                <>
                  <Text style={styles.previewTitle}>Vista previa</Text>
                  <Text style={styles.previewPeriod}>{formatPreviewPeriod()}</Text>
                  <Text style={styles.previewInfo}>
                    Tipo de período: {getCycleLabel(preview.period_type)}
                  </Text>
                  <Text style={styles.previewInfo}>
                    Viajes disponibles: {preview.available_trips}
                  </Text>
                  {preview.available_trips === 0 && (
                    <Text style={styles.previewWarningText}>
                      No hay viajes sin resumen para este período
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.previewPlaceholder}>
                  Selecciona un cliente para ver la vista previa
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Action buttons */}
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
                (!preview || preview.available_trips === 0 || creating) && styles.confirmButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!preview || preview.available_trips === 0 || creating}
            >
              {creating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Generar resumen</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Client selector modal */}
      <Modal
        animationType="slide"
        transparent
        visible={clientSelectorVisible}
        onRequestClose={() => setClientSelectorVisible(false)}
      >
        <View style={styles.clientModalOverlay}>
          <Pressable
            style={styles.clientModalBackdrop}
            onPress={() => setClientSelectorVisible(false)}
          />
          <View style={[styles.clientModalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.clientModalHeader}>
              <Text style={styles.clientModalTitle}>Seleccionar cliente</Text>
              <Pressable
                onPress={() => setClientSelectorVisible(false)}
                style={styles.clientModalClose}
              >
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </Pressable>
            </View>
            <FlatList
              data={clients}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedClient;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.clientItem,
                      isSelected && styles.clientItemSelected,
                      pressed && styles.clientItemPressed,
                    ]}
                    onPress={() => {
                      setSelectedClient(item.id);
                      setClientSelectorVisible(false);
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
                      <Ionicons name="checkmark" size={20} color="#3A6B2A" />
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE0',
    borderRadius: 10,
    padding: 10,
  },
  statLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  statSubtitle: {
    color: '#888888',
    fontSize: 9,
    marginTop: 2,
  },
  periodSection: {
    marginBottom: 20,
  },
  periodLabel: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  periodPills: {
    flexDirection: 'row',
    gap: 8,
  },
  periodPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D8C8',
  },
  periodPillActive: {
    backgroundColor: '#3A6B2A',
    borderColor: '#3A6B2A',
  },
  periodPillText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '600',
  },
  periodPillTextActive: {
    color: '#FFFFFF',
  },
  summaryList: {
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  summaryCardPressed: {
    opacity: 0.8,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  summaryLeftCol: {
    flex: 1,
  },
  summaryRightCol: {
    alignItems: 'flex-end',
  },
  periodText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
  },
  clientText: {
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
  },
  amountText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: '700',
  },
  tripsText: {
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
  },
  summaryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAF7',
    borderTopWidth: 1,
    borderTopColor: '#E8EDE0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0D8',
    borderRadius: 8,
  },
  actionButtonPressed: {
    backgroundColor: '#F5F7F0',
  },
  cycleBadgeRow: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  cycleBadge: {
    backgroundColor: '#F5F7F0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cycleBadgeText: {
    color: '#5F5E5A',
    fontSize: 11,
    fontWeight: '600',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3A6B2A',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    backgroundColor: '#F5F7F0',
  },
  fab: {
    backgroundColor: '#3A6B2A',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: {
    opacity: 0.9,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal styles
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E8EDE0',
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
    borderRadius: 8,
    backgroundColor: '#F5F7F0',
  },
  tabActive: {
    backgroundColor: '#3A6B2A',
  },
  tabText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  fieldLabel: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  clientSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  clientSelectPressed: {
    backgroundColor: '#F5F7F0',
  },
  clientSelectText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '500',
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  datePickerField: {
    flex: 1,
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
  },
  previewCard: {
    backgroundColor: '#F5F7F0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    minHeight: 80,
    justifyContent: 'center',
  },
  previewTitle: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  previewPeriod: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
  },
  previewInfo: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },
  previewPlaceholder: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
  },
  previewWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewWarningText: {
    color: '#854F0B',
    fontSize: 13,
    flex: 1,
  },
  notesSection: {
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 88,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1A1A1A',
    textAlignVertical: 'top',
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
    borderRadius: 10,
    backgroundColor: '#F5F7F0',
  },
  cancelButtonPressed: {
    opacity: 0.8,
  },
  cancelButtonText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#3A6B2A',
  },
  confirmButtonPressed: {
    opacity: 0.9,
  },
  confirmButtonDisabled: {
    backgroundColor: '#B8C4B0',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  // Client selector modal
  clientModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  clientModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  clientModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  clientModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDE0',
  },
  clientModalTitle: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
  },
  clientModalClose: {
    padding: 4,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7F0',
  },
  clientItemSelected: {
    backgroundColor: '#EAF3DE',
  },
  clientItemPressed: {
    backgroundColor: '#F5F7F0',
  },
  clientItemText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '500',
  },
  clientItemTextSelected: {
    color: '#3A6B2A',
    fontWeight: '700',
  },
});
