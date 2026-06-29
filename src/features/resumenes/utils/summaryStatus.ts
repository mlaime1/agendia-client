import { Theme } from '../../../theme';
import type { SummaryStatus } from '../../../services/types';

export function getSummaryStatusLabel(status: SummaryStatus): string {
  const labels: Record<SummaryStatus, string> = {
    draft: 'Borrador',
    sent: 'Enviado',
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

export function getNextSummaryStatus(status: SummaryStatus): SummaryStatus | null {
  if (status === 'draft') return 'sent';
  if (status === 'sent') return 'paid';
  if (status === 'partial') return 'paid';
  if (status === 'paid') return 'archived';
  return null;
}

export function getNextStatusActionLabel(status: SummaryStatus): string | null {
  if (status === 'draft') return 'Marcar enviado';
  if (status === 'sent' || status === 'partial') return 'Marcar abonado';
  if (status === 'paid') return 'Archivar';
  return null;
}

export function canDeleteSummary(status: SummaryStatus): boolean {
  return status === 'draft' || status === 'sent' || status === 'partial';
}
