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
import { Ionicons } from '@expo/vector-icons';

import { AgendiaHeader } from '../../../components/AgendiaHeader';
import { CalendarGrid } from '../components/CalendarGrid';
import { DayDetailsModal } from '../components/DayDetailsModal';
import { ErrorBanner } from '../components/ErrorBanner';
import { QuickActionBar } from '../components/QuickActionBar';
import { SpecialTripModal } from '../components/SpecialTripModal';
import { useCalendarTrips } from '../hooks/useCalendarTrips';
import { TripMode } from '../types';
import { getLeadingEmptyCells, getLongDateLabel, getMonthDays, getMonthLabel } from '../utils/date';
import { useAuth } from '../../../state/AuthContext';

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
  const [monthDate, setMonthDate] = useState(() => new Date());
  const days = useMemo(() => getMonthDays(monthDate), [monthDate]);
  const leadingEmptyCells = useMemo(() => getLeadingEmptyCells(monthDate), [monthDate]);
  const monthLabel = useMemo(() => getMonthLabel(monthDate), [monthDate]);
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
  } = useCalendarTrips(selectedClientId);

  const [selectedMode, setSelectedMode] = useState<TripMode | null>('outbound');
  const [specialDateKey, setSpecialDateKey] = useState<string | null>(null);
  const [detailDateKey, setDetailDateKey] = useState<string | null>(null);

  const detailDay = days.find((day) => day.dateKey === detailDateKey);
  const detailDateLabel = detailDay ? getLongDateLabel(detailDay.date) : '';
  const detailTrips = detailDateKey
    ? Object.entries(tripsByDate).find(([dateKey]) => dateKey === detailDateKey)?.[1] ?? []
    : [];
  const visibleMonthKey = `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
  const visibleMonthTrips = trips.filter((trip) => trip.date.startsWith(visibleMonthKey));
  const selectedClientName = clients.find((client) => client.id === selectedClientId)?.name ?? '';
  const headerUserName = isLoading
    ? 'Cargando...'
    : selectedClientName || userProfile?.name || 'No autenticado';
  const monthSelector = (
    <View style={styles.monthSelector}>
      <Pressable
        accessibilityLabel="Mes anterior"
        onPress={() => changeMonth(-1)}
        style={({ pressed }) => [styles.monthSelectorButton, pressed && styles.pressedButton]}
      >
        <Ionicons name="chevron-back" size={18} color="#1B5E3B" />
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
        <Ionicons name="chevron-forward" size={18} color="#1B5E3B" />
      </Pressable>
    </View>
  );

  const changeMonth = (offset: number) => {
    setMonthDate((currentDate) => new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setDetailDateKey(null);
    setSpecialDateKey(null);
  };

  const goToCurrentMonth = () => {
    setMonthDate(new Date());
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

    addTrip(dateKey, selectedMode);
  };

  const handleSpecialConfirm = (specialType: string, note: string) => {
    if (!specialDateKey) {
      return;
    }

    addSpecialTrip({ dateKey: specialDateKey, specialType, note });
    setSpecialDateKey(null);
  };

  const handleOpenMenu = () => {
    onMenuPress?.();
  };

  const handleDeleteTrip = (tripId: string) => {
    deleteTrip?.(tripId);
  };

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
              onSelectClient={onSelectClient}
              selectedClientId={selectedClientId}
              tripCount={visibleMonthTrips.length}
              userName={headerUserName}
              rightSlot={monthSelector}
            />
          </View>

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
            <ActivityIndicator size="small" color="#247145" />
            <Text style={styles.loadingTitle}>Cargando viajes...</Text>
            <View style={styles.loadingLine} />
            <View style={styles.loadingLine} />
            <View style={[styles.loadingLine, styles.loadingLineShort]} />
          </View>
        ) : (
          <>
            <QuickActionBar selectedMode={selectedMode} onSelectMode={setSelectedMode} />

            <CalendarGrid
              days={days}
              leadingEmptyCells={leadingEmptyCells}
              onDayLongPress={setDetailDateKey}
              onDayPress={handleDayPress}
              tripsByDate={tripsByDate}
            />
          </>
        )}
      </ScrollView>

      <SpecialTripModal
        onClose={() => setSpecialDateKey(null)}
        onConfirm={handleSpecialConfirm}
        visible={specialDateKey !== null}
      />

      <DayDetailsModal
        dateLabel={detailDateLabel}
        onDeleteTrip={handleDeleteTrip}
        onClose={() => setDetailDateKey(null)}
        trips={detailTrips}
        onUpdateTrip={updateTrip}
        visible={detailDateKey !== null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6FAF6',
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
  profileWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F0D2CF',
    borderRadius: 8,
    backgroundColor: '#FFF7F6',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  profileWarningText: {
    flex: 1,
    color: '#7A3732',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
  },
  profileWarningAction: {
    color: '#247145',
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
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthSelectorTextGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
  },
  monthSelectorLabel: {
    color: '#1B5E3B',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  monthSelectorSummary: {
    color: '#3a7a52',
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
    borderColor: '#DFE8E2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  loadingTitle: {
    color: '#3F4C44',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  loadingLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EDF3EE',
  },
  loadingLineShort: {
    width: '72%',
  },
});