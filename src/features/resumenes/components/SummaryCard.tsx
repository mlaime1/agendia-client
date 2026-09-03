import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme";
import type { Summary } from "../../../services/types";
import type { UserRole } from "../../../features/auth/types/user";
import { formatClientPeriod } from "../../../utils/dateTime";
import { SummaryStatusBadge } from "./SummaryStatusBadge";
import { getNextSummaryStatus, canDeleteSummary } from "../utils/summaryStatus";
import { formatCurrency } from "../utils/formatCurrency";
import { useAuth } from "../../../state/AuthContext";
import { usePermissions } from "../../../permissions";

type SummaryCardProps = {
  summary: Summary;
  clientTimezone?: string;
  role?: UserRole;
  onPress: (summaryId: string) => void;
  onDownload: (summary: Summary) => void;
  onShare: (summary: Summary) => void;
  onStatusChange: (summary: Summary) => void;
  onDelete: (summary: Summary) => void;
};

export function SummaryCard({
  summary,
  clientTimezone,
  role = "driver",
  onPress,
  onDownload,
  onShare,
  onStatusChange,
  onDelete,
}: SummaryCardProps) {
  const styles = useStyles();
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const period = formatClientPeriod(summary.period_start, summary.period_end, clientTimezone);
  const clientName = summary.clients?.nombre || "Cliente";
  const nextStatus = getNextSummaryStatus(summary.status);
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
          <SummaryStatusBadge status={summary.status} />
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={15} color={styles.dateIcon.color} />
          <Text style={styles.dateText}>{period}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.actionButtons}>
            <ActionButton icon="eye-outline" label="Ver resumen" onPress={() => onPress(summary.id)} />
            <ActionButton icon="download-outline" label="Descargar resumen" onPress={() => onDownload(summary)} />
            <ActionButton icon="share-outline" label="Compartir resumen" onPress={() => onShare(summary)} />
            {role !== "client" && nextStatus && (
              <ActionButton
                icon={nextStatus === "sent" ? "send-outline" : nextStatus === "paid" ? "checkmark-circle-outline" : "archive-outline"}
                label="Cambiar estado"
                onPress={() => onStatusChange(summary)}
              />
            )}
            {role !== "client" && canDeleteSummary(summary.status) && (
              <ActionButton icon="trash-outline" label="Eliminar resumen" danger onPress={() => onDelete(summary)} />
            )}
          </View>
          {role !== "client" && permissions.can.payments && (
            <Text style={styles.amount}>${formatCurrency(summary.total_amount)}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

function ActionButton({ icon, label, onPress, danger }: ActionButtonProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={17} color={danger ? styles.dangerColor.color : styles.actionIconColor.color} />
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
        indicatorChecked: {
          borderColor: theme.colors.primary,
          backgroundColor: theme.colors.primary,
        },
        indicatorCheck: { color: theme.colors.textInverse },
        body: { flex: 1, minWidth: 0 },
        headerRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 12,
        },
        name: {
          flex: 1,
          color: theme.colors.text,
          fontSize: theme.typography.size.md,
          fontWeight: theme.typography.weight.semibold,
        },
        trips: {
          color: theme.colors.textSubtle,
          fontWeight: theme.typography.weight.medium,
        },
        dateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
        dateIcon: { color: theme.colors.textMuted },
        dateText: { color: theme.colors.textSubtle, fontSize: theme.typography.size.sm },
        footer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        actionButtons: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 },
        actionButton: {
          width: 38,
          height: 38,
          borderRadius: theme.radii.small,
          backgroundColor: theme.colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
        },
        actionButtonPressed: { backgroundColor: theme.colors.surfaceSubtle },
        actionIconColor: { color: theme.colors.textSubtle },
        dangerColor: { color: theme.colors.danger },
        amount: { color: theme.colors.text, fontSize: theme.typography.size.md, fontWeight: theme.typography.weight.bold },
      }),
    [theme],
  );
};
