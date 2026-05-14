import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { summariesService } from '../../../services/summaries';
import type { Summary, SummaryStatus, Trip } from '../../../services/types';

type ResumenDetailScreenProps = {
  summaryId: string;
  onBack: () => void;
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

function formatDayHeader(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const weekday = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
  return `${weekday} ${formatDateLabel(dateKey).slice(0, 5)}`;
}

function formatPeriod(start: string, end: string) {
  return `${formatDateLabel(parseDateKey(start))} — ${formatDateLabel(parseDateKey(end))}`;
}

function formatCurrency(value: string | number) {
  const amount = typeof value === 'number' ? value : parseFloat(value || '0');
  return amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}

function formatTripTypeLabel(trip: Trip) {
  return trip.special_type ? `Especial (${trip.special_type})` : trip.trip_type;
}

type TripGroup = {
  label: string;
  trips: Trip[];
  totalAmount: number;
  totalTrips: number;
};

type DayGroup = {
  dateKey: string;
  groups: TripGroup[];
  subtotal: number;
  tripCount: number;
};

function groupTrips(trips: Trip[]): DayGroup[] {
  const dayMap = new Map<string, Map<string, TripGroup>>();

  trips.forEach((trip) => {
    const dateKey = parseDateKey(trip.trip_date);
    const groupLabel = formatTripTypeLabel(trip);
    const dayGroups = dayMap.get(dateKey) ?? new Map<string, TripGroup>();
    const currentGroup = dayGroups.get(groupLabel) ?? {
      label: groupLabel,
      trips: [],
      totalAmount: 0,
      totalTrips: 0,
    };

    currentGroup.trips.push(trip);
    currentGroup.totalAmount += parseFloat(trip.final_price);
    currentGroup.totalTrips += 1;
    dayGroups.set(groupLabel, currentGroup);
    dayMap.set(dateKey, dayGroups);
  });

  return [...dayMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, groups]) => {
      const orderedGroups = [...groups.values()];
      const subtotal = orderedGroups.reduce((acc, group) => acc + group.totalAmount, 0);
      const tripCount = orderedGroups.reduce((acc, group) => acc + group.totalTrips, 0);

      return {
        dateKey,
        groups: orderedGroups,
        subtotal,
        tripCount,
      };
    });
}

export function ResumenDetailScreen({ summaryId, onBack }: ResumenDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadSummary();
  }, [summaryId]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await summariesService.getById(summaryId);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando resumen');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: SummaryStatus) => {
    if (!summary || updating) return;

    if (newStatus === 'sent' || newStatus === 'paid' || newStatus === 'archived') {
      setUpdating(true);

      try {
        const updated = await summariesService.updateStatus(summaryId, { status: newStatus });
        setSummary(updated);
      } catch (err) {
        console.error('Error updating status:', err);
      } finally {
        setUpdating(false);
      }

      return;
    }

    Alert.alert('Confirmar cambio', `¿Quieres pasar este resumen a ${STATUS_CONFIG[newStatus].label.toLowerCase()}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setUpdating(true);
          try {
            const updated = await summariesService.updateStatus(summaryId, { status: newStatus });

            setSummary(updated);
          } catch (err) {
            console.error('Error updating status:', err);
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!summary || updating) return;

    (async () => {
      setUpdating(true);
      try {
        await summariesService.remove(summaryId);
        onBack();
      } catch (err) {
        console.error('Error deleting summary:', err);
      } finally {
        setUpdating(false);
      }
    })();
  };

  const handleDownloadPdf = async () => {
    const url = summariesService.getPdfUrl(summaryId);
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Error opening PDF:', err);
    }
  };

  const statusConfig = summary ? STATUS_CONFIG[summary.status] : null;

  const renderStatusBadge = () => {
    if (!statusConfig) return null;
    return (
      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
        <View style={[styles.statusDot, { backgroundColor: statusConfig.text }]} />
        <Text style={[styles.statusText, { color: statusConfig.text }]}>
          {statusConfig.label}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper title="Detalle" onBackPress={onBack} rightSlot={renderStatusBadge()}>
        <View style={styles.centered}>
          <ActivityIndicator color="#3A6B2A" size="large" />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !summary) {
    return (
      <ScreenWrapper title="Detalle" onBackPress={onBack}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Resumen no encontrado'}</Text>
          <Pressable style={styles.retryButton} onPress={loadSummary}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  const clientName = summary.clients?.nombre || 'Cliente';
  const driverName = summary.users?.name || 'Chofer';
  const periodLabel = formatPeriod(summary.period_start, summary.period_end);
  const totalAmount = parseFloat(summary.total_amount);
  const trips = summary.trips || [];
  const groupedTrips = groupTrips(trips);
  const uniqueDays = groupedTrips.length;

  const statusAction =
    summary.status === 'draft'
      ? { label: 'Marcar enviado', nextStatus: 'sent' as SummaryStatus }
      : summary.status === 'sent'
        ? { label: 'Marcar abonado', nextStatus: 'paid' as SummaryStatus }
        : summary.status === 'paid'
          ? { label: 'Archivar', nextStatus: 'archived' as SummaryStatus }
          : null;

  return (
    <ScreenWrapper title="Detalle" onBackPress={onBack} rightSlot={renderStatusBadge()}>
      <View style={styles.container}>
        {/* Top card */}
        <View style={styles.topCard}>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text style={styles.driverName}>{driverName}</Text>
          <Text style={styles.periodLabel}>{periodLabel}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.total_trips}</Text>
              <Text style={styles.statLabel}>Viajes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{uniqueDays}</Text>
              <Text style={styles.statLabel}>Días</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statValueGreen]}>
                ${formatCurrency(totalAmount)}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Trip list */}
        <View style={styles.tripListContainer}>
          <Text style={styles.tripListTitle}>Viajes incluidos</Text>
          <FlatList
            data={groupedTrips}
            keyExtractor={(item) => item.dateKey}
            contentContainerStyle={styles.tripList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.emptyText}>No hay viajes en este resumen</Text>}
            renderItem={({ item }) => (
              <View style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>{formatDayHeader(item.dateKey)}</Text>
                  <Text style={styles.daySubtotal}>Subtotal: ${formatCurrency(item.subtotal)}</Text>
                </View>

                {item.groups.map((group, index) => (
                  <View key={`${item.dateKey}-${group.label}`}>
                    <View style={styles.tripRow}>
                      <View style={styles.tripInfo}>
                        <Text style={styles.tripType}>{group.label}</Text>
                        <Text style={styles.tripMeta}>
                          {group.totalTrips} {group.totalTrips === 1 ? 'viaje' : 'viajes'}
                        </Text>
                      </View>
                      <Text style={styles.tripPrice}>${formatCurrency(group.totalAmount)}</Text>
                    </View>
                    {index < item.groups.length - 1 && <View style={styles.tripSeparator} />}
                  </View>
                ))}
              </View>
            )}
          />
        </View>

        {/* Bottom action bar */}
        <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.downloadButton,
              pressed && styles.downloadButtonPressed,
            ]}
            onPress={handleDownloadPdf}
          >
            <Ionicons name="download-outline" size={18} color="#1A1A1A" />
            <Text style={styles.downloadButtonText}>Descargar PDF</Text>
          </Pressable>

          {statusAction ? (
            <Pressable
              style={({ pressed }) => [
                styles.statusButton,
                pressed && styles.statusButtonPressed,
                updating && styles.statusButtonDisabled,
              ]}
              onPress={() => handleStatusChange(statusAction.nextStatus)}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.statusButtonText}>{statusAction.label}</Text>
              )}
            </Pressable>
          ) : (
            <View style={[styles.statusButton, styles.statusButtonDisabled]}>
              <Text style={styles.statusButtonText}>Archivado</Text>
            </View>
          )}
        </View>

        {summary.status === 'draft' && (
          <View style={[styles.deleteRow, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable
              style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color="#B42318" />
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  topCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EDE0',
  },
  clientName: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  driverName: {
    color: '#5F5E5A',
    fontSize: 12,
    marginBottom: 2,
  },
  periodLabel: {
    color: '#888888',
    fontSize: 11,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E8EDE0',
  },
  statValue: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '700',
  },
  statValueGreen: {
    color: '#3A6B2A',
  },
  statLabel: {
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tripListContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tripListTitle: {
    color: '#888888',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  tripList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EDE0',
    overflow: 'hidden',
  },
  daySection: {
    paddingVertical: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FAFAF7',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDE0',
  },
  dayTitle: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
  },
  daySubtotal: {
    color: '#3A6B2A',
    fontSize: 11,
    fontWeight: '700',
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripType: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '600',
  },
  tripMeta: {
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
  },
  tripPrice: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '700',
  },
  tripSeparator: {
    height: 1,
    backgroundColor: '#E8EDE0',
    marginHorizontal: 14,
  },
  emptyText: {
    color: '#888888',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#F5F7F0',
    borderTopWidth: 1,
    borderTopColor: '#E8EDE0',
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDE0',
    borderRadius: 10,
  },
  downloadButtonPressed: {
    backgroundColor: '#F5F7F0',
  },
  downloadButtonText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#3A6B2A',
    borderRadius: 10,
  },
  statusButtonPressed: {
    opacity: 0.9,
  },
  statusButtonDisabled: {
    backgroundColor: '#B8C4B0',
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2C5BE',
    borderRadius: 10,
  },
  deleteButtonPressed: {
    backgroundColor: '#FFF5F3',
  },
  deleteButtonText: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '600',
  },
});
