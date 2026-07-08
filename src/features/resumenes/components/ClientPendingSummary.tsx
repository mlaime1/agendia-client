import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { useTheme } from '../../../theme';
import type { Summary } from '../../../services/types';
import { toClientDate } from '../../../utils/dateTime';
import { SummaryStatusBadge } from './SummaryStatusBadge';
import { formatCurrency } from '../utils/formatCurrency';

type ClientPendingSummaryProps = {
  pendingSummaries: Summary[];
  clientTimezone?: string;
  paymentAlias?: string | null;
  onPayAll: () => void;
};

const MP_PRIMARY = '#00B1EA';
const MP_DARK = '#009EE3';

function formatOldestDate(utcString: string, clientTimezone?: string): string {
  const date = toClientDate(utcString, clientTimezone);
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPeriodShort(startUtc: string, endUtc: string, clientTimezone?: string): string {
  const start = toClientDate(startUtc, clientTimezone);
  const end = toClientDate(endUtc, clientTimezone);
  const fmt = (date: Date) =>
    date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  return `${fmt(start)} al ${fmt(end)}`;
}

export function ClientPendingSummary({
  pendingSummaries,
  clientTimezone,
  paymentAlias,
  onPayAll,
}: ClientPendingSummaryProps) {
  const styles = useStyles();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (pendingSummaries.length === 0) return null;

  const totalAmount = pendingSummaries.reduce((acc, s) => acc + parseFloat(s.total_amount), 0);
  const sortedByOldest = [...pendingSummaries].sort(
    (a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime(),
  );
  const oldestSummary = sortedByOldest[0];
  const oldestPeriod = formatPeriodShort(
    oldestSummary.period_start,
    oldestSummary.period_end,
    clientTimezone,
  );
  const oldestDateLabel = formatOldestDate(oldestSummary.period_start, clientTimezone);

  const handleCopyAlias = async () => {
    const alias = paymentAlias?.trim();
    if (!alias) return;
    await Clipboard.setStringAsync(alias);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="shield-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroText}>
              Tenés <Text style={styles.heroHighlight}>{pendingSummaries.length} resúmenes</Text>{' '}
              pendientes de revisión. El más antiguo es del {oldestPeriod}.
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: theme.colors.primary },
                pressed && styles.ctaPressed,
              ]}
              onPress={() => setExpanded((value) => !value)}
            >
              <Text style={[styles.ctaText, { color: theme.colors.textInverse }]}>
                {expanded ? 'Ocultar detalle' : 'Ver detalle'}
              </Text>
              <Ionicons
                name={expanded ? 'chevron-up-outline' : 'chevron-forward-outline'}
                size={14}
                color={theme.colors.textInverse}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {expanded && (
        <View style={styles.detailPanel}>
          <Text style={styles.detailTitle}>
            {pendingSummaries.length} resúmenes pendientes
          </Text>

          <View style={[styles.detailRow, styles.detailRowFirst]}>
            <Text style={styles.detailKey}>Total pendiente</Text>
            <Text style={styles.detailValue}>${formatCurrency(totalAmount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Pendiente más antiguo</Text>
            <Text style={styles.detailValue}>{oldestDateLabel}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailKey}>Estado</Text>
            <SummaryStatusBadge status="sent" label="Pendiente" />
          </View>

          <Pressable
            style={({ pressed }) => [styles.mpButton, pressed && styles.mpButtonPressed]}
            onPress={onPayAll}
          >
            <View style={styles.mpMark}>
              <Ionicons name="diamond-outline" size={11} color={MP_PRIMARY} />
            </View>
            <Text style={styles.mpButtonText}>
              Pagar todo con Mercado Pago{' '}
              <Text style={styles.mpAmount}>· ${formatCurrency(totalAmount)}</Text>
            </Text>
          </Pressable>

          <Text style={styles.payNote}>
            Se abre un único checkout con los {pendingSummaries.length} resúmenes desglosados.
            También podés pagarlos por separado, más abajo.
          </Text>

          <View style={styles.orDivider}>
            <View style={[styles.orLine, { backgroundColor: theme.colors.border }]} />
            <Text style={styles.orText}>o pagá por transferencia</Text>
            <View style={[styles.orLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <View style={styles.altPay}>
            <View style={styles.altPayTitle}>
              <Ionicons name="card-outline" size={14} color={theme.colors.textSubtle} />
              <Text style={styles.altPayTitleText}>Alias para transferir</Text>
            </View>

            <View style={styles.aliasRow}>
              <View style={styles.aliasInfo}>
                <Text style={styles.aliasLabel}>Alias</Text>
                <Text style={styles.aliasValue} numberOfLines={1}>
                  {paymentAlias?.trim() || 'No configurado'}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.copyButton,
                  copied && {
                    backgroundColor: theme.colors.semantic.success.bg,
                    borderColor: theme.colors.semantic.success.border,
                  },
                  pressed && !copied && styles.copyButtonPressed,
                ]}
                onPress={handleCopyAlias}
                disabled={!paymentAlias?.trim()}
              >
                <Ionicons
                  name={copied ? 'checkmark-outline' : 'copy-outline'}
                  size={14}
                  color={copied ? theme.colors.semantic.success.text : theme.colors.textMuted}
                />
                <Text
                  style={[
                    styles.copyButtonText,
                    copied && { color: theme.colors.semantic.success.text },
                  ]}
                >
                  {copied ? '¡Copiado!' : 'Copiar'}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.hint}>
              Si transferís por el total, marcá los resúmenes que corresponda como abonados desde
              la lista, para que quede registrado.
            </Text>
          </View>
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
          marginBottom: 16,
        },
        hero: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.large,
          padding: 16,
        },
        heroRow: {
          flexDirection: 'row',
          gap: 12,
          alignItems: 'flex-start',
        },
        iconContainer: {
          width: 38,
          height: 38,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
        },
        heroContent: {
          flex: 1,
        },
        heroText: {
          fontSize: 14,
          lineHeight: 21,
          color: theme.colors.text,
          marginBottom: 12,
        },
        heroHighlight: {
          color: theme.colors.primary,
          fontWeight: theme.typography.weight.bold,
        },
        cta: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: theme.radii.pill,
        },
        ctaPressed: {
          opacity: 0.9,
        },
        ctaText: {
          fontSize: 13,
          fontWeight: theme.typography.weight.bold,
        },
        detailPanel: {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          padding: 14,
          marginTop: 10,
        },
        detailTitle: {
          fontSize: 12,
          color: theme.colors.textSubtle,
          marginBottom: 10,
        },
        detailRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        detailRowFirst: {
          borderTopWidth: 0,
        },
        detailRowLast: {
          marginBottom: 12,
        },
        detailKey: {
          fontSize: 13.5,
          color: theme.colors.textSubtle,
        },
        detailValue: {
          fontSize: 13.5,
          fontWeight: theme.typography.weight.bold,
          color: theme.colors.text,
        },
        mpButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          width: '100%',
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
        payNote: {
          fontSize: 11,
          color: theme.colors.textSubtle,
          lineHeight: 16,
          marginTop: 8,
          textAlign: 'center',
        },
        orDivider: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginVertical: 14,
        },
        orLine: {
          flex: 1,
          height: 1,
        },
        orText: {
          fontSize: 11,
          color: theme.colors.textSubtle,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        },
        altPay: {
          backgroundColor: theme.colors.surfaceMuted,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          padding: 12,
        },
        altPayTitle: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 9,
        },
        altPayTitleText: {
          fontSize: 12.5,
          fontWeight: theme.typography.weight.semibold,
          color: theme.colors.textSubtle,
        },
        aliasRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.small,
          paddingVertical: 10,
          paddingLeft: 12,
          paddingRight: 10,
        },
        aliasInfo: {
          flex: 1,
          minWidth: 0,
        },
        aliasLabel: {
          fontSize: 10.5,
          color: theme.colors.textSubtle,
          marginBottom: 2,
        },
        aliasValue: {
          fontSize: 14,
          color: theme.colors.text,
        },
        copyButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: theme.colors.surfaceMuted,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.pill,
          paddingVertical: 8,
          paddingHorizontal: 12,
        },
        copyButtonPressed: {
          backgroundColor: theme.colors.surfaceSubtle,
        },
        copyButtonText: {
          fontSize: 12.5,
          fontWeight: theme.typography.weight.semibold,
          color: theme.colors.textMuted,
        },
        hint: {
          fontSize: 11,
          color: theme.colors.textSubtle,
          lineHeight: 16,
          marginTop: 8,
        },
      }),
    [theme],
  );
};
