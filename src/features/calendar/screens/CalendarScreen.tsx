import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import { AgendiaHeader } from '../../../components/AgendiaHeader';
import { AddTripPanel } from '../components/AddTripPanel';
import { CalendarGrid } from '../components/CalendarGrid';
import { DayDetailsModal } from '../components/DayDetailsModal';
import { ErrorBanner } from '../components/ErrorBanner';
import { SpecialTripModal } from '../components/SpecialTripModal';
import { useCalendarTrips } from '../hooks/useCalendarTrips';
import { useCalendarPermissions } from '../hooks/useCalendarPermissions';
import { TripMode } from '../types';
import { getLeadingEmptyCells, getLongDateLabel, getMonthDays, getMonthLabel } from '../utils/date';
import { useAuth } from '../../../state/AuthContext';
import { Theme, useTheme, useThemedStyles } from '../../../theme';
import { getClientToday } from '../../../utils/dateTime';
import { formatInTimeZone } from 'date-fns-tz';

type ClientOption = {
  id: string;
  name: string;
};

type CalendarScreenProps = {
  onMenuPress?: () => void;
  clients: ClientOption[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
};

export function CalendarScreen({
  onMenuPress,
  clients,
  selectedClientId,
  onSelectClient,
}: CalendarScreenProps) {
  const { profileError, refreshProfile, userProfile, isLoading } = useAuth();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const permissions = useCalendarPermissions(clients, selectedClientId);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const {
    addSpecialTrip,
    addTrip,
    deleteTrip,
    trips,
    tripsByDate,
    updateTrip,
    isLoadingTrips,
    error,
    clearError,
    clientTimezone,
    routeId,
    setRouteId,
    availableRoutes,
  } = useCalendarTrips({
    selectedClientId: permissions.resolvedClientId,
    canCreateRegularTrips: permissions.canCreateRegularTrips,
    canCreateSpecialTrips: permissions.canCreateSpecialTrips,
    canEdit: permissions.canEdit,
    canDeleteTrips: permissions.canDeleteTrips,
  });
  const days = useMemo(() => getMonthDays(monthDate, clientTimezone), [monthDate, clientTimezone]);
  const leadingEmptyCells = useMemo(
    () => getLeadingEmptyCells(monthDate, clientTimezone),
    [monthDate, clientTimezone],
  );
  const monthLabel = useMemo(() => getMonthLabel(monthDate, clientTimezone), [monthDate, clientTimezone]);

  const [selectedMode, setSelectedMode] = useState<TripMode | null>(null);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [specialDateKey, setSpecialDateKey] = useState<string | null>(null);
  const [detailDateKey, setDetailDateKey] = useState<string | null>(null);

  const defaultRouteId = availableRoutes.find((route) => route.is_active !== false)?.id || '';

  const resetAddPanel = () => {
    setIsAddPanelOpen(false);
    setSelectedMode(null);
    setRouteId(defaultRouteId || routeId);
  };

  const canOpenAddPanel = permissions.canCreateAnyTrip;

  const toggleAddPanel = () => {
    if (!canOpenAddPanel) {
      return;
    }

    if (isAddPanelOpen) {
      resetAddPanel();
      return;
    }

    const initialMode = permissions.canCreateRegularTrips ? 'outbound' : 'special';
    setIsAddPanelOpen(true);
    setSelectedMode(initialMode);
    setRouteId(defaultRouteId || routeId);
  };

  const detailDay = days.find((day) => day.dateKey === detailDateKey);
  const detailDateLabel = detailDay ? getLongDateLabel(detailDay.date, clientTimezone) : '';
  const detailTrips = detailDateKey
    ? Object.entries(tripsByDate).find(([dateKey]) => dateKey === detailDateKey)?.[1] ?? []
    : [];
  const visibleMonthKey = clientTimezone
    ? formatInTimeZone(monthDate, clientTimezone, 'yyyy-MM')
    : `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const visibleMonthTrips = trips.filter((trip) => trip.date.startsWith(visibleMonthKey));
  const selectedClientName = clients.find((client) => client.id === permissions.resolvedClientId)?.name ?? '';
  const headerUserName = isLoading
    ? 'Cargando...'
    : selectedClientName || userProfile?.name || 'No autenticado';

  const changeMonth = (offset: number) => {
    setMonthDate(
      (currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1),
    );
    setDetailDateKey(null);
    setSpecialDateKey(null);
  };

  const goToCurrentMonth = () => {
    setMonthDate(getClientToday(clientTimezone));
    setDetailDateKey(null);
    setSpecialDateKey(null);
  };

  const handleDayPress = (dateKey: string) => {
    if (!selectedMode) {
      setDetailDateKey(dateKey);
      return;
    }

    if (selectedMode === 'special') {
      setSpecialDateKey(dateKey);
      return;
    }

    if (!routeId) {
      return;
    }

    addTrip(dateKey, selectedMode);
  };

  const handleSpecialConfirm = (specialType: string, note: string, price?: string) => {
    if (!specialDateKey) {
      return;
    }

    addSpecialTrip({ dateKey: specialDateKey, specialType, note, price });
    setSpecialDateKey(null);
  };

  const handleOpenMenu = () => {
    onMenuPress?.();
  };

  const handleDeleteTrip = (tripId: string) => {
    deleteTrip?.(tripId);
  };

  const addTripLabel = isAddPanelOpen ? 'Cerrar' : 'Agregar viaje';
  const addTripIcon = isAddPanelOpen ? 'close' : 'plus';

  const profileActionsSlot = (
    <React.Fragment>
      {permissions.showClientSelector && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Navegación"
          onPress={() => {}}
          style={({ pressed }) => [styles.iconAction, pressed && styles.iconActionPressed]}
        >
          <AppIcon name="map" size={18} color={theme.colors.textMuted} />
        </Pressable>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={addTripLabel}
        accessibilityState={{ disabled: !canOpenAddPanel }}
        disabled={!canOpenAddPanel}
        onPress={toggleAddPanel}
        style={({ pressed }) => [
          styles.iconAction,
          isAddPanelOpen && styles.iconActionActive,
          !canOpenAddPanel && styles.iconActionDisabled,
          pressed && canOpenAddPanel && styles.iconActionPressed,
        ]}
      >
        <AppIcon
          name={addTripIcon}
          size={18}
          color={
            isAddPanelOpen
              ? theme.colors.textInverse
              : canOpenAddPanel
                ? theme.colors.textMuted
                : theme.colors.textSubtle
          }
        />
      </Pressable>
    </React.Fragment>
  );

  const headerExpandedPanel = (
    <AddTripPanel
      isOpen={isAddPanelOpen}
      selectedMode={selectedMode ?? 'outbound'}
      onSelectMode={setSelectedMode}
      routeId={routeId}
      routes={availableRoutes}
      onSelectRoute={setRouteId}
      canCreateRegularTrips={permissions.canCreateRegularTrips}
      canCreateSpecialTrips={permissions.canCreateSpecialTrips}
    />
  );

  const monthSelector = (
    <View style={styles.monthSelector}>
      <Pressable
        accessibilityLabel="Mes anterior"
        onPress={() => changeMonth(-1)}
        style={({ pressed }) => [styles.monthSelectorButton, pressed && styles.pressedButton]}
      >
        <AppIcon name="chevronLeft" size={18} color={theme.colors.primary} />
      </Pressable>

      <View style={styles.monthSelectorTextGroup}>
        <Text style={styles.monthSelectorLabel}>{monthLabel}</Text>
        <Text style={styles.monthSelectorSummary}>
          {visibleMonthTrips.length === 1 ? '1 viaje' : `${visibleMonthTrips.length} viajes`}
        </Text>
      </View>

      <Pressable
        accessibilityLabel="Mes siguiente"
        onPress={() => changeMonth(1)}
        style={({ pressed }) => [styles.monthSelectorButton, pressed && styles.pressedButton]}
      >
        <AppIcon name="chevronRight" size={18} color={theme.colors.primary} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ErrorBanner message={error} onDismiss={clearError} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.fullBleedHeader}>
            <AgendiaHeader
              onMenuPress={handleOpenMenu}
              onTodayPress={goToCurrentMonth}
              clients={clients}
              onSelectClient={permissions.showClientSelector ? onSelectClient : undefined}
              selectedClientId={permissions.resolvedClientId || ''}
              userName={headerUserName}
              hideClientSelector={!permissions.showClientSelector}
              profileActionsSlot={profileActionsSlot}
              expandedSlot={headerExpandedPanel}
            />
          </View>

          <View style={styles.monthSelectorContainer}>{monthSelector}</View>

          {profileError ? (
            <View style={styles.profileWarning}>
              <Text style={styles.profileWarningText}>No se pudo cargar perfil: {profileError}</Text>
              <Pressable accessibilityRole="button" onPress={refreshProfile}>
                <Text style={styles.profileWarningAction}>Reintentar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {isLoadingTrips ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingTitle}>Cargando viajes...</Text>
            <View style={styles.loadingLine} />
            <View style={styles.loadingLine} />
            <View style={[styles.loadingLine, styles.loadingLineShort]} />
          </View>
        ) : (
          <CalendarGrid
            days={days}
            leadingEmptyCells={leadingEmptyCells}
            onDayLongPress={setDetailDateKey}
            onDayPress={handleDayPress}
            tripsByDate={tripsByDate}
            clientTimezone={clientTimezone}
            isAddModeActive={isAddPanelOpen}
          />
        )}
      </ScrollView>

      <SpecialTripModal
        onClose={() => setSpecialDateKey(null)}
        onConfirm={handleSpecialConfirm}
        visible={specialDateKey !== null}
        canSetPrice={permissions.canSetPrice}
      />

      <DayDetailsModal
        dateLabel={detailDateLabel}
        onDeleteTrip={handleDeleteTrip}
        onClose={() => setDetailDateKey(null)}
        trips={detailTrips}
        onUpdateTrip={updateTrip}
        visible={detailDateKey !== null}
        readOnly={!permissions.canEdit}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    content: {
      paddingHorizontal: 10,
      paddingTop: 0,
      paddingBottom: 28,
    },
    header: {
      gap: 10,
    },
    fullBleedHeader: {
      marginHorizontal: -10,
    },
    monthSelectorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    profileWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      borderWidth: 1,
      borderColor: theme.colors.semantic.error.border,
      borderRadius: 8,
      backgroundColor: theme.colors.semantic.error.bg,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    profileWarningText: {
      flex: 1,
      color: theme.colors.semantic.error.text,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0,
    },
    profileWarningAction: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0,
    },
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    monthSelectorButton: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthSelectorTextGroup: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
    },
    monthSelectorLabel: {
      color: theme.colors.primary,
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0,
    },
    monthSelectorSummary: {
      color: theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0,
    },
    pressedButton: {
      opacity: 0.72,
    },
    loadingCard: {
      marginTop: 12,
      gap: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 14,
      backgroundColor: theme.colors.surface,
    },
    loadingTitle: {
      color: theme.colors.textMuted,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0,
    },
    loadingLine: {
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.surfaceMuted,
    },
    loadingLineShort: {
      width: '72%',
    },
    iconAction: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceMuted,
    },
    iconActionActive: {
      backgroundColor: theme.colors.primary,
    },
    iconActionDisabled: {
      opacity: 0.45,
    },
    iconActionPressed: {
      opacity: 0.8,
    },
  });
