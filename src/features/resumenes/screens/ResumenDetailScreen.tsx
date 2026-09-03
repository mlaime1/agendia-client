import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SummaryStatus } from '../../../services/types';

import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { useTheme } from '../../../theme';
import { formatClientPeriod, getClientDateKey, getClientTimezone } from '../../../utils/dateTime';
import type { UserRole } from '../../../features/auth/types/user';
import { useSummary } from '../hooks/useSummary';
import { useSummaryActions } from '../hooks/useSummaryActions';
import { SummaryStatusBadge } from '../components/SummaryStatusBadge';
import { SummaryTripList } from '../components/SummaryTripList';
import { SummaryActions } from '../components/SummaryActions';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuth } from '../../../state/AuthContext';
import { usePermissions } from '../../../permissions';

type ResumenDetailScreenProps = {
  summaryId: string;
  role?: UserRole;
  onBack: () => void;
};

export function ResumenDetailScreen({ summaryId, role = 'driver', onBack }: ResumenDetailScreenProps) {
  const isClientView = role === 'client';
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const styles = useStyles();
  const { summary, loading, error, refetch } = useSummary(summaryId);
  const { updating, deleting, reportingPayment, updateStatus, deleteSummary, reportPayment } = useSummaryActions();

  const handleUpdateStatus = useCallback(
    async (id: string, status: SummaryStatus) => {
      await updateStatus(id, status);
      refetch();
    },
    [refetch, updateStatus],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteSummary(id);
      onBack();
    },
    [deleteSummary, onBack],
  );

  const handleReportPayment = useCallback(
    async (currentSummary: NonNullable<typeof summary>): Promise<boolean> => {
      const reported = await reportPayment(currentSummary);
      if (reported) {
        refetch();
      }
      return reported;
    },
    [refetch, reportPayment],
  );

  const renderStatusBadge = () => {
    if (!summary) return null;
    return <SummaryStatusBadge status={summary.status} />;
  };

  // These values are needed by hooks that must run before any early return.
  const safeClientTimezone = getClientTimezone(summary?.clients);
  const safeTrips = summary?.trips ?? [];
  const uniqueDays = React.useMemo(
    () => new Set(safeTrips.map((t) => getClientDateKey(t.trip_date, safeClientTimezone))).size,
    [safeTrips, safeClientTimezone],
  );

  if (loading) {
    return (
      <ScreenWrapper title="Detalle" onBackPress={onBack} rightSlot={renderStatusBadge()}>
        <View style={styles.centered}>
          <ActivityIndicator color={styles.activityColor.color} size="large" />
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !summary) {
    return (
      <ScreenWrapper title="Detalle" onBackPress={onBack}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Resumen no encontrado'}</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  const clientName = summary.clients?.nombre || 'Cliente';
  const clientTimezone = safeClientTimezone;
  const periodLabel = formatClientPeriod(summary.period_start, summary.period_end, clientTimezone);
  const totalAmount = parseFloat(summary.total_amount);
  const paidAmount = parseFloat(summary.paid_amount || '0');
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const trips = safeTrips;

  return (
    <ScreenWrapper title="Detalle" onBackPress={onBack} rightSlot={renderStatusBadge()}>
      <View style={styles.container}>
        <View style={styles.topCard}>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{clientName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.identityContent}>
              <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
              <View style={styles.dateChip}>
                <Ionicons name="calendar-outline" size={13} color={styles.dateChipText.color} />
                <Text style={styles.dateChipText}>{periodLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="paper-plane-outline" size={20} color={styles.statIcon.color} />
              </View>
              <Text style={styles.statValue}>{summary.total_trips}</Text>
              <Text style={styles.statLabel}>Viajes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="calendar-outline" size={20} color={styles.statIcon.color} />
              </View>
              <Text style={styles.statValue}>{uniqueDays}</Text>
              <Text style={styles.statLabel}>Días</Text>
            </View>
            <View style={styles.statDivider} />
            {permissions.can.payments && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statValuePrimary]}>
                  ${formatCurrency(totalAmount)}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            )}
          </View>

          {permissions.can.payments && paidAmount > 0 && (
            <View style={styles.paymentRow}>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Abonado</Text>
                <Text style={styles.paymentValue}>${formatCurrency(paidAmount)}</Text>
              </View>
              {pendingAmount > 0 && (
                <View style={styles.paymentItem}>
                  <Text style={styles.paymentLabel}>Saldo</Text>
                  <Text style={[styles.paymentValue, styles.paymentValuePending]}>
                    ${formatCurrency(pendingAmount)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <SummaryTripList trips={trips} clientTimezone={clientTimezone} />

        <SummaryActions
          summary={summary}
          updating={updating}
          deleting={deleting}
          reportingPayment={reportingPayment}
          readOnly={isClientView}
          onUpdateStatus={handleUpdateStatus}
          onDelete={handleDelete}
          onReportPayment={isClientView ? handleReportPayment : undefined}
        />
      </View>
    </ScreenWrapper>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
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
        topCard: {
          backgroundColor: theme.colors.surface,
          margin: 16,
          padding: 16,
          borderRadius: theme.radii.medium,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        clientName: {
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.bold,
          marginBottom: 2,
        },
        periodLabel: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          marginBottom: 16,
        },
        statsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.medium,
          paddingVertical: 14,
          paddingHorizontal: 8,
        },
        statItem: {
          flex: 1,
          alignItems: 'center',
        },
        statDivider: {
          width: 1,
          height: 32,
          backgroundColor: theme.colors.border,
        },
        statValue: {
          color: theme.colors.text,
          fontSize: theme.typography.size.xl,
          fontWeight: theme.typography.weight.bold,
        },
        statValuePrimary: {
          color: theme.colors.primary,
        },
        statLabel: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          marginTop: 2,
          textTransform: 'uppercase',
        },
        paymentRow: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        paymentItem: {
          alignItems: 'center',
        },
        paymentLabel: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          textTransform: 'uppercase',
          marginBottom: 2,
        },
        paymentValue: {
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.bold,
        },
        paymentValuePending: {
          color: theme.colors.danger,
        },
        activityColor: {
          color: theme.colors.primary,
        },
        identityRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          marginBottom: 18,
        },
        avatar: {
          width: 52,
          height: 52,
          borderRadius: theme.radii.medium,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.primary,
        },
        avatarText: {
          color: theme.colors.textInverse,
          fontSize: theme.typography.size.xl,
          fontWeight: theme.typography.weight.bold,
        },
        identityContent: {
          flex: 1,
          minWidth: 0,
        },
        dateChip: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 7,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: theme.radii.small,
          backgroundColor: theme.colors.surfaceMuted,
        },
        dateChipText: {
          color: theme.colors.textMuted,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.semibold,
        },
        statIcon: {
          color: theme.colors.primary,
          marginBottom: 2,
        },
      }),
    [theme],
  );
};
