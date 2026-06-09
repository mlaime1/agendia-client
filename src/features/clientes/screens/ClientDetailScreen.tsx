import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { ScreenWrapper } from '../../../components/ScreenWrapper';
import { Theme } from '../../../theme';
import { useThemedStyles } from '../../../theme/useThemedStyles';
import { useClientDetail, useClientSchedules } from '../hooks';
import type { ServiceSchedule } from '../../../services/types';

type ClientDetailScreenProps = {
  clientId: string;
  onBack: () => void;
  onEditClient: () => void;
  onEditContract: () => void;
  onAddResponsible: () => void;
};

const DAY_NAMES = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const BILLING_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'A';
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function ClientDetailScreen({
  clientId,
  onBack,
  onEditClient,
  onEditContract,
  onAddResponsible,
}: ClientDetailScreenProps) {
  const styles = useThemedStyles(createStyles);
  const { client, loading, error, refetch } = useClientDetail(clientId);
  const { schedules, loading: loadingSchedules } = useClientSchedules(clientId);

  if (loading) {
    return (
      <ScreenWrapper title="Cliente" onBackPress={onBack}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={styles.loadingColor.color} />
          <Text style={styles.loadingText}>Cargando cliente...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !client) {
    return (
      <ScreenWrapper title="Cliente" onBackPress={onBack}>
        <View style={styles.centered}>
          <AppIcon name="alert" size={40} color={styles.errorIconColor.color} />
          <Text style={styles.errorText}>{error || 'Cliente no encontrado'}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            onPress={refetch}
          >
            <AppIcon name="refresh" size={16} color={styles.retryButtonText.color} />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  const initial = getInitial(client.nombre);
  const billingLabel = BILLING_LABELS[client.billing_cycle] || 'Mensual';
  const billingStart = formatDate(client.billing_start_date || null);

  return (
    <ScreenWrapper title="Cliente" onBackPress={onBack}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{initial}</Text>
          </View>
          <Text style={styles.heroName}>{client.nombre}</Text>
          <View style={styles.heroBadges}>
            <View style={styles.pillActive}>
              <AppIcon name="checkCircle" size={12} color={styles.pillActiveText.color} />
              <Text style={styles.pillActiveText}>Cliente activo</Text>
            </View>
            <View style={styles.pillBilling}>
              <Text style={styles.pillBillingText}>Facturación {billingLabel.toLowerCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Datos personales</Text>
            <Pressable
              style={({ pressed }) => [styles.sectionAction, pressed && styles.sectionActionPressed]}
              onPress={onEditClient}
            >
              <AppIcon name="edit" size={14} color={styles.sectionActionText.color} />
              <Text style={styles.sectionActionText}>Editar</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <AppIcon name="phone" size={17} color={styles.rowIconColor.color} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Teléfono</Text>
              <Text style={styles.rowValue}>{client.phone}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Contrato de servicio</Text>
            <Pressable
              style={({ pressed }) => [styles.sectionAction, pressed && styles.sectionActionPressed]}
              onPress={onEditContract}
            >
              <AppIcon name="edit" size={14} color={styles.sectionActionText.color} />
              <Text style={styles.sectionActionText}>Editar</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <AppIcon name="receipt" size={17} color={styles.rowIconColor.color} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Facturación</Text>
              <Text style={styles.rowValue}>
                {billingLabel}{billingStart ? ` · desde ${billingStart}` : ''}
              </Text>
            </View>
          </View>

          {loadingSchedules ? (
            <View style={styles.scheduleLoading}>
              <ActivityIndicator size="small" color={styles.loadingColor.color} />
              <Text style={styles.scheduleLoadingText}>Cargando horarios...</Text>
            </View>
          ) : schedules.length > 0 ? (
            <View style={styles.scheduleBlock}>
              <Text style={styles.scheduleBlockLabel}>Horarios habituales</Text>
              {schedules.map((schedule) => (
                <ScheduleRow key={schedule.id} schedule={schedule} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Responsables</Text>
          </View>

          <View style={styles.emptyResponsibles}>
            <Text style={styles.emptyResponsiblesText}>Sin responsables vinculados</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.addRow, pressed && styles.addRowPressed]}
            onPress={onAddResponsible}
          >
            <View style={styles.addIcon}>
              <AppIcon name="plus" size={16} color={styles.addActionText.color} />
            </View>
            <Text style={styles.addActionText}>Agregar responsable</Text>
          </Pressable>
        </View>

        <View style={styles.spacer} />

        <Pressable style={({ pressed }) => [styles.dangerButton, pressed && styles.dangerButtonPressed]}>
          <AppIcon name="userOff" size={18} color={styles.dangerButtonText.color} />
          <Text style={styles.dangerButtonText}>Desactivar cliente</Text>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

function ScheduleRow({ schedule }: { schedule: ServiceSchedule }) {
  const styles = useThemedStyles(createScheduleRowStyles);
  const dayName = DAY_NAMES[schedule.day_of_week] || '';

  return (
    <View style={styles.scheduleRow}>
      <Text style={styles.schedDay}>{dayName}</Text>
      <View style={styles.schedTimes}>
        <View style={styles.schedTimeBadge}>
          <Text style={styles.schedTimeText}>{schedule.pickup_time}</Text>
        </View>
        {schedule.return_time && (
          <>
            <AppIcon name="arrowRight" size={14} color={styles.schedArrowColor.color} />
            <View style={styles.schedTimeBadge}>
              <Text style={styles.schedTimeText}>{schedule.return_time}</Text>
            </View>
          </>
        )}
      </View>
      {schedule.label && <Text style={styles.schedLabel}>{schedule.label}</Text>}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingTop: 10,
      paddingBottom: 40,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingVertical: 48,
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    loadingColor: {
      color: theme.colors.primary,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.textSubtle,
      fontWeight: '500',
    },
    errorIconColor: {
      color: theme.colors.danger,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginTop: 8,
    },
    retryButtonPressed: {
      opacity: 0.85,
    },
    retryButtonText: {
      color: theme.colors.primaryLight,
      fontSize: 14,
      fontWeight: '600',
    },
    hero: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 20,
    },
    avatarLarge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    avatarLargeText: {
      fontSize: 26,
      fontWeight: '700',
      color: theme.colors.primaryLight,
    },
    heroName: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 8,
    },
    heroBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    pillActive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.primaryLight,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    pillActiveText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '700',
    },
    pillBilling: {
      backgroundColor: theme.colors.background,
      borderRadius: 999,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    pillBillingText: {
      color: theme.colors.textSubtle,
      fontSize: 11,
      fontWeight: '700',
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      marginHorizontal: 16,
      marginBottom: 10,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 4,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.textSubtle,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    sectionActionPressed: {
      opacity: 0.7,
    },
    sectionActionText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 18,
      gap: 13,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    rowTop: {
      alignItems: 'flex-start',
      paddingTop: 13,
      paddingBottom: 13,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowIconTop: {
      marginTop: 2,
    },
    rowIconColor: {
      color: theme.colors.primary,
    },
    rowContent: {
      flex: 1,
    },
    rowLabel: {
      fontSize: 11,
      color: theme.colors.textSubtle,
      fontWeight: '500',
      marginBottom: 2,
    },
    rowValue: {
      fontSize: 13,
      color: theme.colors.text,
      fontWeight: '500',
    },
    observationsText: {
      fontSize: 12,
      color: theme.colors.textSubtle,
      lineHeight: 18,
    },
    observationsEmpty: {
      fontSize: 12,
      color: theme.colors.textSubtle,
      fontStyle: 'italic',
    },
    scheduleLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    scheduleLoadingText: {
      fontSize: 12,
      color: theme.colors.textSubtle,
    },
    scheduleBlock: {
      paddingTop: 10,
      paddingHorizontal: 18,
      paddingBottom: 14,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    scheduleBlockLabel: {
      fontSize: 11,
      color: theme.colors.textSubtle,
      fontWeight: '500',
      marginBottom: 8,
    },
    spacer: {
      height: 8,
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 16,
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'rgba(192,57,43,0.2)',
      backgroundColor: 'transparent',
    },
    dangerButtonPressed: {
      backgroundColor: 'rgba(192,57,43,0.05)',
    },
    dangerButtonText: {
      color: theme.colors.danger,
      fontSize: 14,
      fontWeight: '600',
    },
    responsibleList: {
      paddingVertical: 4,
    },
    emptyResponsibles: {
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    emptyResponsiblesText: {
      fontSize: 13,
      color: theme.colors.textSubtle,
      fontStyle: 'italic',
    },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderTopWidth: 0.5,
      borderTopColor: theme.colors.border,
    },
    addRowPressed: {
      opacity: 0.7,
    },
    addIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addActionText: {
      color: theme.colors.primary,
      fontSize: 13,
      fontWeight: '600',
    },
  });

const createScheduleRowStyles = (theme: Theme) =>
  StyleSheet.create({
    scheduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.border,
    },
    schedDay: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
      width: 32,
    },
    schedTimes: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    schedTimeBadge: {
      backgroundColor: theme.colors.primaryLight,
      borderRadius: 6,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    schedTimeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    schedArrowColor: {
      color: theme.colors.disabled,
    },
    schedLabel: {
      fontSize: 11,
      color: theme.colors.textSubtle,
      fontWeight: '500',
    },
  });
