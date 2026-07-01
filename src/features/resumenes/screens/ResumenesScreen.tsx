import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { useTheme } from '../../../theme';
import { clientsService } from '../../../services/clients';
import type { Summary, SummaryStatus } from '../../../services/types';
import type { UserRole } from '../../../features/auth/types/user';
import { getClientTimezone, toClientDate } from '../../../utils/dateTime';
import { confirmAction } from '../../../utils/confirmAction';
import { useSummaries } from '../hooks/useSummaries';
import { useSummaryActions } from '../hooks/useSummaryActions';
import { SummaryCard } from '../components/SummaryCard';
import { CreateSummaryModal } from '../components/CreateSummaryModal';
import { formatCurrency } from '../utils/formatCurrency';
import { getNextSummaryStatus, getNextStatusActionLabel } from '../utils/summaryStatus';
import { summariesService } from '../../../services/summaries';

type SummaryFilter = 'all' | SummaryStatus;

type ResumenesScreenProps = {
  selectedClientId: string;
  driverId: string;
  role?: UserRole;
  onMenuPress: () => void;
  onOpenDetail: (summaryId: string) => void;
};

export function ResumenesScreen({
  selectedClientId,
  driverId,
  role = 'driver',
  onMenuPress,
  onOpenDetail,
}: ResumenesScreenProps) {
  const isClientView = role === 'client';
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [clientTimezone, setClientTimezone] = useState<string>(getClientTimezone());

  const { summaries, loading, error, refetch } = useSummaries(selectedClientId || null);
  const { updating, updateStatus, deleteSummary } = useSummaryActions();

  const filterOptions = useMemo(
    () => {
      const all: Array<{ value: SummaryFilter; label: string }> = [
        { value: 'all', label: 'Todos' },
        { value: 'draft', label: 'Borrador' },
        { value: 'sent', label: 'Enviado' },
        { value: 'partial', label: 'Parcial' },
        { value: 'paid', label: 'Abonado' },
        { value: 'archived', label: 'Archivado' },
      ];
      if (isClientView) {
        return all.filter((option) => option.value !== 'draft');
      }
      return all;
    },
    [isClientView],
  );

  useEffect(() => {
    if (!selectedClientId) return;

    const controller = new AbortController();

    const loadClient = async () => {
      try {
        const client = await clientsService.getById(selectedClientId);
        if (controller.signal.aborted) return;
        setClientTimezone(getClientTimezone(client));
      } catch (err) {
        if (controller.signal.aborted) return;
        // No bloqueamos la pantalla por error de timezone
        console.warn('Error loading client timezone:', err);
      }
    };

    loadClient();

    return () => controller.abort();
  }, [selectedClientId]);

  const filteredSummaries = useMemo(() => {
    if (summaryFilter === 'all') return summaries;
    return summaries.filter((summary) => summary.status === summaryFilter);
  }, [summaries, summaryFilter]);

  const { pendingCount, pendingAmount, thisMonthAmount, thisMonthCount } = useMemo(() => {
    const pendingStatuses = isClientView
      ? (['sent', 'partial'] as SummaryStatus[])
      : (['draft', 'sent', 'partial'] as SummaryStatus[]);
    const pending = summaries.filter((s) => pendingStatuses.includes(s.status));
    const pendingAmount = pending.reduce((acc, s) => acc + parseFloat(s.total_amount), 0);

    const today = new Date();
    const thisMonth = summaries.filter((s) => {
      if (!s.paid_at) return false;
      const paidDate = toClientDate(s.paid_at, clientTimezone);
      return paidDate.getMonth() === today.getMonth() && paidDate.getFullYear() === today.getFullYear();
    });
    const thisMonthAmount = thisMonth.reduce((acc, s) => acc + parseFloat(s.total_amount), 0);

    return {
      pendingCount: pending.length,
      pendingAmount,
      thisMonthAmount,
      thisMonthCount: thisMonth.length,
    };
  }, [summaries, clientTimezone, isClientView]);

  const handleStatusChange = useCallback(
    (summary: Summary) => {
      const nextStatus = getNextSummaryStatus(summary.status);
      const actionLabel = getNextStatusActionLabel(summary.status);
      if (!nextStatus || !actionLabel) return;

      confirmAction('Confirmar cambio', `¿Querés ${actionLabel.toLowerCase()} este resumen?`, async () => {
        try {
          await updateStatus(summary.id, nextStatus);
          refetch();
        } catch {
          // Error ya mostrado por useFeedback
        }
      });
    },
    [refetch, updateStatus],
  );

  const handleDelete = useCallback(
    (summary: Summary) => {
      confirmAction(
        'Eliminar resumen',
        '¿Estás seguro? Los viajes quedarán disponibles para facturar nuevamente.',
        async () => {
          try {
            await deleteSummary(summary.id);
            refetch();
          } catch {
            // Error ya mostrado por useFeedback
          }
        },
      );
    },
    [deleteSummary, refetch],
  );

  const handleDownload = useCallback(async (id: string) => {
    try {
      const url = summariesService.getPdfUrl(id);
      await Linking.openURL(url);
    } catch (err) {
      // Error manejado por el sistema
      console.error('Error opening PDF:', err);
    }
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={styles.activityColor.color} size="large" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }

    if (filteredSummaries.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {summaryFilter === 'all' ? 'No hay resúmenes' : 'No hay resúmenes con este filtro'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {filteredSummaries.map((summary) => (
          <SummaryCard
            key={summary.id}
            summary={summary}
            role={role}
            clientTimezone={clientTimezone}
            onPress={onOpenDetail}
            onDownload={handleDownload}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        ))}
      </View>
    );
  };

  return (
    <ScreenWrapper title="Resúmenes" onMenuPress={onMenuPress}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pendientes</Text>
            <Text style={styles.statValue}>${formatCurrency(pendingAmount)}</Text>
            <Text style={styles.statSubtitle}>{pendingCount} resúmenes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Este mes</Text>
            <Text style={styles.statValue}>${formatCurrency(thisMonthAmount)}</Text>
            <Text style={styles.statSubtitle}>{thisMonthCount} cobrados</Text>
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>FILTROS</Text>
          <View style={styles.filterPills}>
            {filterOptions.map((option) => {
              const isActive = summaryFilter === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setSummaryFilter(option.value)}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {renderContent()}
      </ScrollView>

      {!isClientView && (
        <>
          <View style={[styles.fabContainer, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable
              style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.fabText}>+ Nuevo resumen</Text>
            </Pressable>
          </View>

          <CreateSummaryModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            selectedClientId={selectedClientId}
            driverId={driverId}
            clientTimezone={clientTimezone}
            onSuccess={() => {
              setModalVisible(false);
              refetch();
            }}
          />
        </>
      )}
    </ScreenWrapper>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
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
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          padding: 10,
        },
        statLabel: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.bold,
          textTransform: 'uppercase',
        },
        statValue: {
          color: theme.colors.text,
          fontSize: theme.typography.size.xl,
          fontWeight: theme.typography.weight.bold,
          marginTop: 4,
        },
        statSubtitle: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          marginTop: 2,
        },
        filterSection: {
          marginBottom: 20,
        },
        sectionLabel: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.bold,
          textTransform: 'uppercase',
          marginBottom: 8,
        },
        filterPills: {
          flexDirection: 'row',
          gap: 8,
          flexWrap: 'wrap',
        },
        filterPill: {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        filterPillActive: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        filterPillText: {
          color: theme.colors.text,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.semibold,
        },
        filterPillTextActive: {
          color: theme.colors.textInverse,
        },
        list: {
          gap: 12,
        },
        centered: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 40,
        },
        errorText: {
          color: theme.colors.danger,
          fontSize: theme.typography.size.md,
          textAlign: 'center',
          marginBottom: 12,
        },
        retryButton: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radii.small,
        },
        retryButtonText: {
          color: theme.colors.textInverse,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
        },
        emptyText: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.md,
          textAlign: 'center',
        },
        fabContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 12,
          backgroundColor: theme.colors.background,
        },
        fab: {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radii.medium,
          height: 50,
          alignItems: 'center',
          justifyContent: 'center',
        },
        fabPressed: {
          opacity: 0.9,
        },
        fabText: {
          color: theme.colors.textInverse,
          fontSize: theme.typography.size.lg,
          fontWeight: theme.typography.weight.bold,
        },
        activityColor: {
          color: theme.colors.primary,
        },
      }),
    [theme],
  );
};
