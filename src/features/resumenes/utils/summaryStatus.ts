import { Theme } from '../../../theme';
import type { SummaryStatus } from '../../../services/types';

export function getSummaryStatusLabel(status: SummaryStatus): string {
  const labels: Record<SummaryStatus, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
    payment_reported: 'Pago informado',
    partial: 'Pago parcial',
    paid: 'Abonado',
    archived: 'Archivado',
  };

  return labels[status] ?? status;
}

export function getSummaryStatusConfig(status: SummaryStatus, theme: Theme) {
  const config = theme.colors.summaryStatus[status as keyof typeof theme.colors.summaryStatus];

  if (config) {
    return {
      bg: config.bg,
      text: config.text,
      label: getSummaryStatusLabel(status),
    };
  }

  return {
    bg: theme.colors.surfaceMuted,
    text: theme.colors.textMuted,
    label: getSummaryStatusLabel(status),
  };
}

export function getNextSummaryStatus(status: SummaryStatus): SummaryStatus | undefined {
  // El PATCH genérico de estado queda reservado para flujos generales:
  // los estados financieros (payment_reported, partial, paid) deben
  // alcanzarse mediante las acciones específicas del flujo de pagos.
  if (status === 'draft') return 'sent';
  if (status === 'paid') return 'archived';
  return undefined;
}

export function getNextStatusActionLabel(status: SummaryStatus): string | undefined {
  if (status === 'draft') return 'Marcar enviado';
  if (status === 'paid') return 'Archivar';
  return undefined;
}

export function canDeleteSummary(status: SummaryStatus): boolean {
  return status === 'draft' || status === 'sent' || status === 'partial';
}
