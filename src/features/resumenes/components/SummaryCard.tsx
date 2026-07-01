import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../theme';
import type { Summary } from '../../../services/types';
import type { UserRole } from '../../../features/auth/types/user';
import { formatClientPeriod } from '../../../utils/dateTime';
import { SummaryStatusBadge } from './SummaryStatusBadge';
import { getCycleLabel } from '../utils/summaryCycle';
import { formatCurrency } from '../utils/formatCurrency';
import { getNextSummaryStatus } from '../utils/summaryStatus';

type SummaryCardProps = {
  summary: Summary;
  clientTimezone?: string;
  role?: UserRole;
  onPress: (summaryId: string) => void;
  onDownload: (summaryId: string) => void;
  onStatusChange: (summary: Summary) => void;
  onDelete: (summary: Summary) => void;
};

export function SummaryCard({
  summary,
  clientTimezone,
  role = 'driver',
  onPress,
  onDownload,
  onStatusChange,
  onDelete,
}: SummaryCardProps) {
  const isClientView = role === 'client';
  const styles = useStyles();
  const period = formatClientPeriod(summary.period_start, summary.period_end, clientTimezone);
  const clientName = summary.clients?.nombre || 'Cliente';
  const cycleLabel = getCycleLabel(summary.period_type);
  const nextStatus = getNextSummaryStatus(summary.status);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(summary.id)}
    >
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <Text style={styles.periodText}>{period}</Text>
          <Text style={styles.clientText}>{clientName}</Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={styles.amountText}>${formatCurrency(summary.total_amount)}</Text>
          <Text style={styles.tripsText}>{summary.total_trips} viajes</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.actionButtons}>
          <ActionButton icon="eye-outline" onPress={() => onPress(summary.id)} />
          <ActionButton icon="download-outline" onPress={() => onDownload(summary.id)} />

          {!isClientView && nextStatus && (
            <ActionButton
              icon={
                nextStatus === 'sent'
                  ? 'send-outline'
                  : nextStatus === 'paid'
                    ? 'checkmark-circle-outline'
                    : 'archive-outline'
              }
              onPress={() => onStatusChange(summary)}
            />
          )}

          {!isClientView && summary.status === 'draft' && (
            <ActionButton icon="trash-outline" danger onPress={() => onDelete(summary)} />
          )}

          <SummaryStatusBadge status={summary.status} />
        </View>
      </View>

      <View style={styles.cycleBadgeRow}>
        <View style={styles.cycleBadge}>
          <Text style={styles.cycleBadgeText}>{cycleLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
};

function ActionButton({ icon, onPress, danger }: ActionButtonProps) {
  const styles = useStyles();
  return (
    <Pressable
      style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={16} color={danger ? styles.dangerColor.color : styles.actionIconColor.color} />
    </Pressable>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          overflow: 'hidden',
        },
        cardPressed: {
          opacity: 0.8,
        },
        topRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: 12,
        },
        leftCol: {
          flex: 1,
        },
        rightCol: {
          alignItems: 'flex-end',
        },
        periodText: {
          color: theme.colors.text,
          fontSize: theme.typography.size.sm,
          fontWeight: theme.typography.weight.bold,
        },
        clientText: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          marginTop: 2,
        },
        amountText: {
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.bold,
        },
        tripsText: {
          color: theme.colors.textSubtle,
          fontSize: theme.typography.size.xs,
          marginTop: 2,
        },
        bottomRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.surfaceSubtle,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingHorizontal: 12,
          paddingVertical: 8,
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
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.small,
        },
        actionButtonPressed: {
          backgroundColor: theme.colors.surfaceMuted,
        },
        actionIconColor: {
          color: theme.colors.text,
        },
        dangerColor: {
          color: theme.colors.danger,
        },
        cycleBadgeRow: {
          paddingHorizontal: 12,
          paddingBottom: 12,
          alignItems: 'flex-start',
        },
        cycleBadge: {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radii.pill,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        cycleBadgeText: {
          color: theme.colors.textMuted,
          fontSize: theme.typography.size.xs,
          fontWeight: theme.typography.weight.semibold,
        },
      }),
    [theme],
  );
};
