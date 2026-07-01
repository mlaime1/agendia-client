import React from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme';
import type { Summary, SummaryStatus } from '../../../services/types';
import { confirmAction } from '../../../utils/confirmAction';
import {
  getNextStatusActionLabel,
  getNextSummaryStatus,
  canDeleteSummary,
  getSummaryStatusLabel,
} from '../utils/summaryStatus';
import { summariesService } from '../../../services/summaries';

type SummaryActionsProps = {
  summary: Summary;
  updating: boolean;
  deleting: boolean;
  readOnly?: boolean;
  onUpdateStatus: (summaryId: string, status: SummaryStatus) => Promise<unknown>;
  onDelete: (summaryId: string) => Promise<unknown>;
};

export function SummaryActions({
  summary,
  updating,
  deleting,
  readOnly = false,
  onUpdateStatus,
  onDelete,
}: SummaryActionsProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const nextStatus = getNextSummaryStatus(summary.status);
  const actionLabel = getNextStatusActionLabel(summary.status);

  const handleDownloadPdf = async () => {
    const url = summariesService.getPdfUrl(summary.id);
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error('Error opening PDF:', err);
    }
  };

  const handleStatusChange = () => {
    if (!nextStatus || !actionLabel) return;
    confirmAction('Confirmar cambio', `¿Querés ${actionLabel.toLowerCase()} este resumen?`, async () => {
      await onUpdateStatus(summary.id, nextStatus);
    });
  };

  const handleDelete = () => {
    const statusLabel = getSummaryStatusLabel(summary.status).toLowerCase();
    confirmAction(
      'Eliminar resumen',
      `Este resumen está en estado "${statusLabel}". ¿Estás seguro de eliminarlo? Los ${summary.total_trips} viajes incluidos quedarán disponibles para facturar nuevamente.`,
      async () => {
        await onDelete(summary.id);
      },
      'Eliminar',
    );
  };

  if (readOnly) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.downloadButton,
            styles.downloadButtonFull,
            pressed && styles.downloadButtonPressed,
          ]}
          onPress={handleDownloadPdf}
        >
          <Ionicons name="download-outline" size={18} color={styles.downloadText.color} />
          <Text style={styles.downloadText}>Descargar PDF</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.actionBar}>
        <Pressable
          style={({ pressed }) => [styles.downloadButton, pressed && styles.downloadButtonPressed]}
          onPress={handleDownloadPdf}
        >
          <Ionicons name="download-outline" size={18} color={styles.downloadText.color} />
          <Text style={styles.downloadText}>Descargar PDF</Text>
        </Pressable>

        {nextStatus ? (
          <Pressable
            style={({ pressed }) => [
              styles.statusButton,
              pressed && styles.statusButtonPressed,
              updating && styles.statusButtonDisabled,
            ]}
            onPress={handleStatusChange}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color={styles.statusButtonText.color} size="small" />
            ) : (
              <Text style={styles.statusButtonText}>{actionLabel}</Text>
            )}
          </Pressable>
        ) : (
          <View style={[styles.statusButton, styles.statusButtonDisabled]}>
            <Text style={styles.statusButtonText}>Archivado</Text>
          </View>
        )}
      </View>

      {canDeleteSummary(summary.status) && (
        <View style={styles.deleteRow}>
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
              deleting && styles.deleteButtonDisabled,
            ]}
            onPress={handleDelete}
            disabled={deleting}
            hitSlop={12}
          >
            {deleting ? (
              <ActivityIndicator color={styles.deleteText.color} size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color={styles.deleteText.color} />
                <Text style={styles.deleteText}>Eliminar</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        actionBar: {
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingTop: 12,
        },
        downloadButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
        },
        downloadButtonPressed: {
          backgroundColor: theme.colors.surfaceMuted,
        },
        downloadButtonFull: {
          flex: 0,
          width: '100%',
        },
        downloadText: {
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
        },
        statusButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radii.medium,
        },
        statusButtonPressed: {
          opacity: 0.9,
        },
        statusButtonDisabled: {
          backgroundColor: theme.colors.disabled,
        },
        statusButtonText: {
          color: theme.colors.textInverse,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
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
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.semantic.error.border,
          borderRadius: theme.radii.medium,
        },
        deleteButtonPressed: {
          backgroundColor: theme.colors.surfaceMuted,
        },
        deleteButtonDisabled: {
          opacity: 0.7,
        },
        deleteText: {
          color: theme.colors.danger,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
        },
      }),
    [theme],
  );
};
