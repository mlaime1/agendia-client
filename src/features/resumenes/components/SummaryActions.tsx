import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme';
import { useFeedback } from '../../../state/FeedbackContext';
import type { Summary, SummaryStatus } from '../../../services/types';
import { confirmAction } from '../../../utils/confirmAction';
import {
  getNextStatusActionLabel,
  getNextSummaryStatus,
  canDeleteSummary,
  getSummaryStatusLabel,
} from '../utils/summaryStatus';
import { summariesService } from '../../../services/summaries';
import { useAuth } from '../../../state/AuthContext';
import { usePermissions } from '../../../permissions';
import { getErrorMessage } from '../../../utils/errorMessage';

type SummaryActionsProps = {
  summary: Summary;
  updating: boolean;
  deleting: boolean;
  reportingPayment: boolean;
  paying: boolean;
  readOnly?: boolean;
  onUpdateStatus: (summaryId: string, status: SummaryStatus) => Promise<unknown>;
  onDelete: (summaryId: string) => Promise<unknown>;
  onReportPayment?: (summary: Summary) => Promise<boolean>;
  onMarkPaid?: (summary: Summary) => Promise<void>;
};

export function SummaryActions({
  summary,
  updating,
  deleting,
  reportingPayment,
  paying,
  readOnly = false,
  onUpdateStatus,
  onDelete,
  onReportPayment,
  onMarkPaid,
}: SummaryActionsProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { showFeedback } = useFeedback();
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const nextStatus = getNextSummaryStatus(summary.status);
  const actionLabel = getNextStatusActionLabel(summary.status);
  const canMarkPaid =
    summary.status === 'sent' || summary.status === 'payment_reported' || summary.status === 'partial';

  const handleDownloadPdf = async () => {
    try {
      await summariesService.downloadPdf(summary);
      showFeedback({ type: 'success', message: 'PDF guardado en la carpeta Descargas de Android' });
    } catch (err) {
      showFeedback({
        type: 'error',
        message: getErrorMessage(err, 'Error al descargar el PDF'),
      });
    }
  };

  const handleSharePdf = async () => {
    try {
      await summariesService.sharePdf(summary);
    } catch (err) {
      showFeedback({
        type: 'error',
        message: getErrorMessage(err, 'Error al compartir el PDF'),
      });
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

  const handleReportPayment = () => {
    if (!onReportPayment || reportingPayment || summary.status !== 'sent') return;

    confirmAction(
      'Informar pago',
      'Se informará que pagaste este resumen. ¿Querés continuar?',
      async () => {
        await onReportPayment(summary);
      },
      'Informar pago',
    );
  };

  if (readOnly || !permissions.can.summaryManagement) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.actionBar}>
          <Pressable
            style={({ pressed }) => [
              styles.downloadButton,
              pressed && styles.downloadButtonPressed,
            ]}
            onPress={handleDownloadPdf}
          >
            <Ionicons name="download-outline" size={18} color={styles.downloadText.color} />
            <Text style={styles.downloadText}>Descargar</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.downloadButton,
              pressed && styles.downloadButtonPressed,
            ]}
            onPress={handleSharePdf}
          >
            <Ionicons name="share-outline" size={18} color={styles.downloadText.color} />
            <Text style={styles.downloadText}>Compartir</Text>
          </Pressable>
        </View>
        {onReportPayment && summary.status === 'sent' && (
          <Pressable
            style={({ pressed }) => [
              styles.statusButton,
              styles.statusButtonFull,
              pressed && styles.statusButtonPressed,
              reportingPayment && styles.statusButtonDisabled,
            ]}
            onPress={handleReportPayment}
            disabled={reportingPayment}
          >
            {reportingPayment ? (
              <ActivityIndicator color={styles.statusButtonText.color} size="small" />
            ) : (
              <Text style={styles.statusButtonText}>Informar pago</Text>
            )}
          </Pressable>
        )}
        {onReportPayment && summary.status === 'payment_reported' && (
          <View style={[styles.statusButton, styles.statusButtonDisabled, styles.statusButtonFull]}>
            <Text style={styles.statusButtonText}>Pago informado</Text>
          </View>
        )}
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
          <Text style={styles.downloadText}>Descargar</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.downloadButton, pressed && styles.downloadButtonPressed]}
          onPress={handleSharePdf}
        >
          <Ionicons name="share-outline" size={18} color={styles.downloadText.color} />
          <Text style={styles.downloadText}>Compartir</Text>
        </Pressable>

        {canMarkPaid && onMarkPaid ? (
          <Pressable
            style={({ pressed }) => [
              styles.statusButton,
              pressed && styles.statusButtonPressed,
              paying && styles.statusButtonDisabled,
            ]}
            onPress={() => onMarkPaid(summary)}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator color={styles.statusButtonText.color} size="small" />
            ) : (
              <Text style={styles.statusButtonText}>Marcar abonado</Text>
            )}
          </Pressable>
        ) : nextStatus ? (
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
        ) : summary.status === 'archived' ? (
          <View style={[styles.statusButton, styles.statusButtonDisabled]}>
            <Text style={styles.statusButtonText}>Archivado</Text>
          </View>
        ) : null}
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
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
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
          minWidth: 0,
        },
        downloadText: {
          flexShrink: 1,
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
          textAlign: 'center',
        },
        statusButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 10,
          backgroundColor: theme.colors.accent,
          borderRadius: theme.radii.medium,
        },
        statusButtonFull: {
          flex: 0,
          alignSelf: 'stretch',
          minHeight: 48,
          marginHorizontal: 16,
          marginTop: 8,
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
