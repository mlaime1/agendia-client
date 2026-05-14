import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  paid: { bg: '#EAF3DE', text: '#3B6D11', label: 'Pagado' },
  archived: { bg: '#F1EFE8', text: '#5F5E5A', label: 'Archivado' },
};

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

    setUpdating(true);
    try {
      const updated = await summariesService.updateStatus(summaryId, { status: newStatus });
      setSummary(updated);
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadPdf = async () => {
    const url = summariesService.getPdfUrl(summaryId);
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Error opening PDF:', err);
    }
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${startDate.getDate()} – ${endDate.getDate()} ${months[endDate.getMonth()]} ${endDate.getFullYear()}`;
  };

  const formatTripDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
  };

  const statusConfig = summary ? STATUS_CONFIG[summary.status] : null;

  const renderTrip = ({ item }: { item: Trip }) => (
    <View style={styles.tripRow}>
      <View style={styles.tripInfo}>
        <Text style={styles.tripDate}>{formatTripDate(item.trip_date)}</Text>
        <Text style={styles.tripType}>{item.trip_type}</Text>
      </View>
      <Text style={styles.tripPrice}>${parseFloat(item.final_price).toFixed(2)}</Text>
    </View>
  );

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
  const periodLabel = formatPeriod(summary.period_start, summary.period_end);
  const totalAmount = parseFloat(summary.total_amount);
  const trips = summary.trips || [];

  // Calculate unique days
  const uniqueDays = new Set(trips.map((t) => t.trip_date)).size;

  return (
    <ScreenWrapper title="Detalle" onBackPress={onBack} rightSlot={renderStatusBadge()}>
      <View style={styles.container}>
        {/* Top card */}
        <View style={styles.topCard}>
          <Text style={styles.clientName}>{clientName}</Text>
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
                ${totalAmount.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Trip list */}
        <View style={styles.tripListContainer}>
          <Text style={styles.tripListTitle}>Viajes incluidos</Text>
          <FlatList
            data={trips}
            keyExtractor={(item) => item.id}
            renderItem={renderTrip}
            ItemSeparatorComponent={() => <View style={styles.tripSeparator} />}
            contentContainerStyle={styles.tripList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No hay viajes en este resumen</Text>
            }
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

          {summary.status === 'draft' && (
            <Pressable
              style={({ pressed }) => [
                styles.statusButton,
                pressed && styles.statusButtonPressed,
                updating && styles.statusButtonDisabled,
              ]}
              onPress={() => handleStatusChange('sent')}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.statusButtonText}>Marcar enviado</Text>
              )}
            </Pressable>
          )}

          {summary.status === 'sent' && (
            <Pressable
              style={({ pressed }) => [
                styles.statusButton,
                pressed && styles.statusButtonPressed,
                updating && styles.statusButtonDisabled,
              ]}
              onPress={() => handleStatusChange('paid')}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.statusButtonText}>Marcar pagado</Text>
              )}
            </Pressable>
          )}

          {summary.status === 'paid' && (
            <View style={[styles.statusButton, styles.statusButtonDisabled]}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.statusButtonText}>Pagado</Text>
            </View>
          )}

          {summary.status === 'archived' && (
            <View style={[styles.statusButton, styles.statusButtonDisabled]}>
              <Text style={styles.statusButtonText}>Archivado</Text>
            </View>
          )}
        </View>
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
  tripDate: {
    color: '#1A1A1A',
    fontSize: 11,
    fontWeight: '700',
  },
  tripType: {
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
});
