import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Trip } from '../types';
import { TripStamp } from './TripStamp';

type DayDetailsModalProps = {
  visible: boolean;
  dateLabel: string;
  trips: Trip[];
  onClose: () => void;
};

const tripLabels = {
  outbound: 'Outbound',
  roundTrip: 'Round trip',
  special: 'Special',
};

export function DayDetailsModal({ visible, dateLabel, trips, onClose }: DayDetailsModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Day details</Text>
              <Text style={styles.title}>{dateLabel}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          {trips.length === 0 ? (
            <Text style={styles.emptyText}>No trips yet.</Text>
          ) : (
            <View style={styles.tripList}>
              {trips.map((trip, index) => (
                <View key={trip.id} style={styles.tripRow}>
                  <TripStamp mode={trip.mode} />
                  <Text style={styles.tripText}>
                    {index + 1}. {tripLabels[trip.mode]}
                    {trip.specialType ? ` - ${trip.specialType}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(28, 39, 30, 0.28)',
  },
  panel: {
    maxHeight: '72%',
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  eyebrow: {
    color: '#6D7C72',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 2,
    color: '#253229',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0,
  },
  closeButton: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#EFF4F0',
  },
  closeText: {
    color: '#526057',
    fontWeight: '800',
    letterSpacing: 0,
  },
  emptyText: {
    color: '#6D7C72',
    fontSize: 15,
    letterSpacing: 0,
  },
  tripList: {
    gap: 10,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 34,
  },
  tripText: {
    flex: 1,
    color: '#354039',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
