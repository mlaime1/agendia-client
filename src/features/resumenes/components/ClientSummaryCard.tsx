import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme";
import type { Summary } from "../../../services/types";
import { formatClientPeriod } from "../../../utils/dateTime";
import { SummaryStatusBadge } from "./SummaryStatusBadge";
import { useAuth } from "../../../state/AuthContext";
import { usePermissions } from "../../../permissions";

type ClientSummaryCardProps = {
  summary: Summary;
  clientTimezone?: string;
  isFirst?: boolean;
  isLast?: boolean;
  onPress: (summaryId: string) => void;
  onDownload: (summary: Summary) => void;
  onShare: (summary: Summary) => void;
  onPay?: (summaryId: string) => void;
};

export function ClientSummaryCard({ summary, clientTimezone, onPress, onDownload, onShare, onPay }: ClientSummaryCardProps) {
  const styles = useStyles();
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const period = formatClientPeriod(summary.period_start, summary.period_end, clientTimezone);
  const clientName = summary.clients?.nombre || "Tus viajes";
  const isPending = summary.status === "sent" || summary.status === "partial";
  const isChecked = summary.status === "paid";

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(summary.id)}
    >
      <View style={styles.indicatorColumn}>
        <View style={[styles.indicator, isChecked && styles.indicatorChecked]}>
          {isChecked && <Ionicons name="checkmark" size={14} color={styles.indicatorCheck.color} />}
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {clientName} <Text style={styles.trips}>· {summary.total_trips} {summary.total_trips === 1 ? "viaje" : "viajes"}</Text>
          </Text>
          <SummaryStatusBadge status={summary.status} label={summary.status === "sent" ? "Pendiente" : undefined} />
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={15} color={styles.dateIcon.color} />
          <Text style={styles.dateText}>{period}</Text>
        </View>

        <View style={styles.actions}>
          <ActionButton icon="eye-outline" label="Ver resumen" onPress={() => onPress(summary.id)} />
          <ActionButton icon="download-outline" label="Descargar resumen" onPress={() => onDownload(summary)} />
          <ActionButton icon="share-outline" label="Compartir resumen" onPress={() => onShare(summary)} />
        </View>

        {permissions.can.payments && isPending && onPay && (
          <Pressable
            style={({ pressed }) => [styles.payButton, pressed && styles.payButtonPressed]}
            onPress={() => onPay(summary.id)}
            accessibilityRole="button"
            accessibilityLabel="Pagar resumen"
          >
            <Ionicons name="card-outline" size={16} color={styles.payButtonText.color} />
            <Text style={styles.payButtonText}>Pagar con Mercado Pago</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

type ActionButtonProps = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void };

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={17} color={styles.actionIconColor.color} />
    </Pressable>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return React.useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: "row",
          gap: 12,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.medium,
          padding: 16,
        },
        cardPressed: { opacity: 0.84 },
        indicatorColumn: { paddingTop: 2 },
        indicator: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: theme.colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        indicatorChecked: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
        indicatorCheck: { color: theme.colors.textInverse },
        body: { flex: 1, minWidth: 0 },
        headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 },
        name: { flex: 1, color: theme.colors.text, fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.semibold },
        trips: { color: theme.colors.textSubtle, fontWeight: theme.typography.weight.medium },
        dateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
        dateIcon: { color: theme.colors.textMuted },
        dateText: { color: theme.colors.textSubtle, fontSize: theme.typography.size.sm },
        actions: { flexDirection: "row", gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border },
        actionButton: { flex: 1, height: 38, borderRadius: theme.radii.small, backgroundColor: theme.colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
        actionButtonPressed: { backgroundColor: theme.colors.surfaceSubtle },
        actionIconColor: { color: theme.colors.textSubtle },
        payButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, paddingVertical: 10, borderRadius: theme.radii.small, backgroundColor: theme.colors.primary },
        payButtonPressed: { opacity: 0.88 },
        payButtonText: { color: theme.colors.textInverse, fontSize: theme.typography.size.sm, fontWeight: theme.typography.weight.bold },
      }),
    [theme],
  );
};
