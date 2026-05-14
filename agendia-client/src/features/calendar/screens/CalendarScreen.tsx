import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CalendarGrid } from '../components/CalendarGrid';
import { DayDetailsModal } from '../components/DayDetailsModal';
import { ErrorBanner } from '../components/ErrorBanner';
import { QuickActionBar } from '../components/QuickActionBar';
import { SpecialTripModal } from '../components/SpecialTripModal';
import { useCalendarTrips } from '../hooks/useCalendarTrips';
import { TripMode } from '../types';
import { getLeadingEmptyCells, getLongDateLabel, getMonthDays, getMonthLabel } from '../utils/date';
import { useAuth } from '../../../state/AuthContext';

export function CalendarScreen() {
  const { logout, profileError, refreshProfile, userProfile } = useAuth();
  const [monthDate, setMonthDate] = useState(() => new Date());
  const days = useMemo(() => getMonthDays(monthDate), [monthDate]);
  const leadingEmptyCells = useMemo(() => getLeadingEmptyCells(monthDate), [monthDate]);
  const monthLabel = useMemo(() => getMonthLabel(monthDate), [monthDate]);
  const { addSpecialTrip, addTrip, trips, tripsByDate, updateTrip, error, clearError } = useCalendarTrips();

  const [selectedMode, setSelectedMode] = useState<TripMode | null>('outbound');
  const [specialDateKey, setSpecialDateKey] = useState<string | null>(null);
  const [detailDateKey, setDetailDateKey] = useState<string | null>(null);

  const detailDay = days.find((day) => day.dateKey === detailDateKey);
  const detailDateLabel = detailDay ? getLongDateLabel(detailDay.date) : '';
  const detailTrips = detailDateKey ? tripsByDate[detailDateKey] ?? [] : [];
  const visibleMonthKey = `${monthDate.getFullYear()}-${(monthDate.getMonth() + 1)
    .toString()
    .padStart(2, '0')}`;
  const visibleMonthTrips = trips.filter((trip) => trip.date.startsWith(visibleMonthKey));
  const tripSummary =
    visibleMonthTrips.length === 1 ? '1 viaje este mes' : `${visibleMonthTrips.length} viajes este mes`;

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ErrorBanner message={error} onDismiss={clearError} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.appTitleRow}>
            <View style={styles.appTitleGroup}>
              <Text style={styles.appName}>Agendia</Text>
              <Text style={styles.userLabel}>{userProfile?.name ?? 'Sesion activa'}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={logout}
              style={({ pressed }) => [styles.logoutButton, pressed && styles.pressedButton]}
            >
              <Text style={styles.logoutButtonText}>Salir</Text>
            </Pressable>
          </View>

          {profileError ? (
            <View style={styles.profileWarning}>
              <Text style={styles.profileWarningText}>No se pudo cargar /users/me.</Text>
              <Pressable accessibilityRole="button" onPress={refreshProfile}>
                <Text style={styles.profileWarningAction}>Reintentar</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.monthRow}>
            <Pressable
              accessibilityLabel="Mes anterior"
              onPress={() => changeMonth(-1)}
              style={({ pressed }) => [styles.monthButton, pressed && styles.pressedButton]}
            >
              <Text style={styles.monthButtonText}>{'<'}</Text>
            </Pressable>

            <View style={styles.monthTitleGroup}>
              <Text style={styles.month}>{monthLabel}</Text>
              <Text style={styles.summary}>{tripSummary}</Text>
            </View>

            <Pressable
              accessibilityLabel="Mes siguiente"
              onPress={() => changeMonth(1)}
              style={({ pressed }) => [styles.monthButton, pressed && styles.pressedButton]}
            >
              <Text style={styles.monthButtonText}>{'>'}</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={goToCurrentMonth}
            style={({ pressed }) => [styles.todayButton, pressed && styles.pressedButton]}
          >
            <Text style={styles.todayButtonText}>Hoy</Text>
          </Pressable>
        </View>

        <QuickActionBar selectedMode={selectedMode} onSelectMode={setSelectedMode} />

        <CalendarGrid
          days={days}
          leadingEmptyCells={leadingEmptyCells}
          onDayLongPress={setDetailDateKey}
          onDayPress={handleDayPress}
          tripsByDate={tripsByDate}
        />
      </ScrollView>

      <SpecialTripModal
        onClose={() => setSpecialDateKey(null)}
        onConfirm={handleSpecialConfirm}
        visible={specialDateKey !== null}
      />

      <DayDetailsModal
        dateLabel={detailDateLabel}
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
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    gap: 10,
  },
  appTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  appTitleGroup: {
    flex: 1,
    gap: 2,
  },
  appName: {
    color: '#233329',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  userLabel: {
    color: '#718077',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  logoutButton: {
    minHeight: 36,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7E2D8',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  logoutButtonText: {
    color: '#A33A34',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
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
  month: {
    color: '#3D4C42',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  summary: {
    color: '#718077',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthTitleGroup: {
    flex: 1,
    gap: 2,
  },
  monthButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D7E2D8',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  monthButtonText: {
    color: '#314139',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 24,
  },
  todayButton: {
    alignSelf: 'center',
    minHeight: 34,
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#CFE0D3',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  todayButtonText: {
    color: '#247145',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  pressedButton: {
    opacity: 0.72,
  },
});
