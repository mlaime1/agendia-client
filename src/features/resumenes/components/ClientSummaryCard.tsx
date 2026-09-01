import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme';
import type { Summary } from '../../../services/types';
import { formatClientPeriod } from '../../../utils/dateTime';
import { SummaryStatusBadge } from './SummaryStatusBadge';
import { getSummaryStatusConfig } from '../utils/summaryStatus';
import { getCycleLabel } from '../utils/summaryCycle';
import { formatCurrency } from '../utils/formatCurrency';
import { useAuth } from '../../../state/AuthContext';
import { usePermissions } from '../../../permissions';

type ClientSummaryCardProps = {
  summary: Summary;
  clientTimezone?: string;
  isFirst?: boolean;
  isLast?: boolean;
  onPress: (summaryId: string) => void;
  onDownload: (summaryId: string) => void;
  onPay?: (summaryId: string) => void;
};

const STOP_SIZE = 38;
const NODE_SIZE = 11;
const NODE_CENTER = 18 + NODE_SIZE / 2;

const MP_PRIMARY = '#00B1EA';
const MP_DARK = '#009EE3';

export function ClientSummaryCard({
  summary,
  clientTimezone,
  isFirst = false,
  isLast = false,
  onPress,
  onDownload,
  onPay,
}: ClientSummaryCardProps) {
  const styles = useStyles();
  const { theme } = useTheme();
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const period = formatClientPeriod(summary.period_start, summary.period_end, clientTimezone);
  const clientName = summary.clients?.nombre || 'Tus viajes';
  const statusConfig = getSummaryStatusConfig(summary.status, theme);
  const cycleLabel = getCycleLabel(summary.period_type);
  const isPending = summary.status === 'sent' || summary.status === 'partial';

  return (
    <View style={styles.row}>
      <View style={styles.stopColumn}>
        {!isFirst && (
          <View
            style={[
              styles.line,
              {
                top: -14,
                height: 14 + NODE_CENTER,
                backgroundColor: theme.colors.border,
              },
            ]}
          />
        )}
        <View style={[styles.node, { borderColor: statusConfig.text }]} />
        {!isLast && (
          <View
            style={[
              styles.line,
              {
                top: NODE_CENTER,
                bottom: -14,
                backgroundColor: theme.colors.border,
              },
            ]}
          />
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => onPress(summary.id)}
      >
        <View style={styles.topRow}>
          <Text style={styles.period}>{period}</Text>
          <SummaryStatusBadge
            status={summary.status}
            label={summary.status === 'sent' ? 'Pendiente' : undefined}
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {clientName} <Text style={styles.metaSeparator}>·</Text> {summary.total_trips}{' '}
            {summary.total_trips === 1 ? 'viaje' : 'viajes'}
          </Text>
          {cycleLabel ? <Text style={styles.cycleLabel}>{cycleLabel}</Text> : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.actions}>
            <ActionButton icon="eye-outline" onPress={() => onPress(summary.id)} />
            <ActionButton icon="download-outline" onPress={() => onDownload(summary.id)} />
          </View>
          {permissions.can.payments && (
            <Text style={styles.amount}>${formatCurrency(summary.total_amount)}</Text>
          )}
        </View>

        {permissions.can.payments && isPending && onPay && (
          <Pressable
            style={({ pressed }) => [styles.mpButton, pressed && styles.mpButtonPressed]}
            onPress={() => onPay(summary.id)}
          >
            <View style={styles.mpMark}>
              <Ionicons name="diamond-outline" size={11} color={MP_PRIMARY} />
            </View>
            <Text style={styles.mpButtonText}>
              Pagar con Mercado Pago{' '}
              <Text style={styles.mpAmount}>· ${formatCurrency(summary.total_amount)}</Text>
            </Text>
          </Pressable>
        )}
      </Pressable>
    </View>
  );
}

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function ActionButton({ icon, onPress }: ActionButtonProps) {
  const styles = useStyles();
  return (
    <Pressable
      style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={16} color={styles.actionIconColor.color} />
    </Pressable>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 14,
          marginBottom: 14,
        },
        stopColumn: {
          width: STOP_SIZE,
          alignItems: 'center',
          paddingTop: 18,
          position: 'relative',
        },
        node: {
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: NODE_SIZE / 2,
          backgroundColor: theme.colors.surface,
          borderWidth: 2,
          zIndex: 1,
        },
        line: {
          position: 'absolute',
          width: 1.5,
          zIndex: 0,
        },
        card: {
          flex: 1,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          padding: 14,
        },
        cardPressed: {
          opacity: 0.85,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 6,
        },
        period: {
          flex: 1,
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.bold,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 12,
        },
        metaText: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.sm,
        },
        metaSeparator: {
          color: theme.colors.textMuted,
        },
        cycleLabel: {
          color: theme.colors.textMuted,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.semibold,
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.pill,
          paddingHorizontal: 8,
          paddingVertical: 2,
        },
        footer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        actions: {
          flexDirection: 'row',
          gap: 6,
        },
        actionButton: {
          width: 30,
          height: 30,
          borderRadius: theme.radii.small,
          backgroundColor: theme.colors.surfaceMuted,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        actionButtonPressed: {
          backgroundColor: theme.colors.surfaceSubtle,
        },
        actionIconColor: {
          color: theme.colors.textSubtle,
        },
        amount: {
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.bold,
        },
        mpButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
          marginTop: 12,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 11,
          backgroundColor: MP_PRIMARY,
        },
        mpButtonPressed: {
          opacity: 0.9,
        },
        mpMark: {
          width: 18,
          height: 18,
          borderRadius: 5,
          backgroundColor: '#04141C',
          alignItems: 'center',
          justifyContent: 'center',
        },
        mpButtonText: {
          color: '#04141C',
          fontSize: 13,
          fontWeight: theme.typography.weight.bold,
        },
        mpAmount: {
          fontWeight: theme.typography.weight.medium,
          opacity: 0.9,
        },
      }),
    [theme],
  );
};
