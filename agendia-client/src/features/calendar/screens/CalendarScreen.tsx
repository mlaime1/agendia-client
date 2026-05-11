import React, { useMemo, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { CalendarGrid } from '../components/CalendarGrid';
import { DayDetailsModal } from '../components/DayDetailsModal';
import { QuickActionBar } from '../components/QuickActionBar';
import { SpecialTripModal } from '../components/SpecialTripModal';
import { useCalendarTrips } from '../hooks/useCalendarTrips';
import { TripMode } from '../types';
import { getLeadingEmptyCells, getLongDateLabel, getMonthDays, getMonthLabel } from '../utils/date';

export function CalendarScreen() {
  const monthDate = useMemo(() => new Date(), []);
  const days = useMemo(() => getMonthDays(monthDate), [monthDate]);
  const leadingEmptyCells = useMemo(() => getLeadingEmptyCells(monthDate), [monthDate]);
  const monthLabel = useMemo(() => getMonthLabel(monthDate), [monthDate]);
  const { addSpecialTrip, addTrip, trips, tripsByDate, updateTrip } = useCalendarTrips();

  const [selectedMode, setSelectedMode] = useState<TripMode | null>('outbound');
  const [specialDateKey, setSpecialDateKey] = useState<string | null>(null);
  const [detailDateKey, setDetailDateKey] = useState<string | null>(null);

  const detailDay = days.find((day) => day.dateKey === detailDateKey);
  const detailDateLabel = detailDay ? getLongDateLabel(detailDay.date) : '';
  const detailTrips = detailDateKey ? tripsByDate[detailDateKey] ?? [] : [];
  const tripSummary = trips.length === 1 ? '1 viaje este mes' : `${trips.length} viajes este mes`;

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.appName}>Agendia</Text>
          <Text style={styles.month}>{monthLabel}</Text>
          <Text style={styles.summary}>{tripSummary}</Text>
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
    gap: 3,
  },
  appName: {
    color: '#233329',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  month: {
    color: '#3D4C42',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
  },
  summary: {
    color: '#718077',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
