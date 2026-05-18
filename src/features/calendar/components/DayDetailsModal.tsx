import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Trip, TripMode, TripUpdates } from '../types';
import { TripStamp } from './TripStamp';

type DayDetailsModalProps = {
  visible: boolean;
  dateLabel: string;
  trips: Trip[];
  onClose: () => void;
  onUpdateTrip: (tripId: string, updates: TripUpdates) => void;
  onDeleteTrip: (tripId: string) => void;
};

const tripLabels: Record<TripMode, string> = {
  outbound: 'Ida',
  roundTrip: 'Ida y vuelta',
  special: 'Especial',
};

const modeOptions: TripMode[] = ['outbound', 'roundTrip', 'special'];
const SWIPE_CLOSE_DISTANCE = 120;
const SWIPE_CLOSE_VELOCITY = 1;
const PANEL_EXIT_TRANSLATE_Y = 520;

export function DayDetailsModal({
  visible,
  dateLabel,
  trips,
  onClose,
  onUpdateTrip,
  onDeleteTrip,
}: DayDetailsModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const [openNoteEditors, setOpenNoteEditors] = useState<Record<string, boolean>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [translateY, visible]);

  useEffect(() => {
    if (!visible) {
      setOpenNoteEditors({});
      setNoteDrafts({});
    }
  }, [visible]);

  const closeWithSwipeAnimation = () => {
    Animated.timing(translateY, {
      toValue: PANEL_EXIT_TRANSLATE_Y,
      duration: 170,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const vertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
          return vertical && gestureState.dy > 8;
        },
        onPanResponderMove: (_, gestureState) => {
          const nextTranslate = Math.max(0, gestureState.dy);
          translateY.setValue(nextTranslate);
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldClose =
            gestureState.dy > SWIPE_CLOSE_DISTANCE || gestureState.vy > SWIPE_CLOSE_VELOCITY;

          if (shouldClose) {
            closeWithSwipeAnimation();
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
      }),
    [translateY],
  );

  const handleModeChange = (trip: Trip, mode: TripMode) => {
    onUpdateTrip(trip.id, {
      mode,
      specialType: mode === 'special' ? trip.specialType?.trim() || 'Ruta especial' : undefined,
    });
  };

  const toggleNoteEditor = (tripId: string) => {
    setOpenNoteEditors((current) => {
      const isOpen = !current[tripId];

      if (isOpen) {
        const currentTrip = trips.find((trip) => trip.id === tripId);
        setNoteDrafts((drafts) => ({
          ...drafts,
          [tripId]: currentTrip?.note ?? '',
        }));
      }

      return {
        ...current,
        [tripId]: isOpen,
      };
    });
  };

  const saveNote = (tripId: string) => {
    const draft = noteDrafts[tripId] ?? '';
    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      return;
    }

    onUpdateTrip(tripId, { note: trimmedDraft });
    setOpenNoteEditors((current) => ({
      ...current,
      [tripId]: false,
    }));
  };

  const cancelNote = (tripId: string) => {
    setNoteDrafts((current) => ({
      ...current,
      [tripId]: '',
    }));

    setOpenNoteEditors((current) => ({
      ...current,
      [tripId]: false,
    }));
  };

  const confirmDeleteTrip = (trip: Trip) => {
    onDeleteTrip(trip.id);
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[styles.panel, { transform: [{ translateY }] }]}
        >
          <View style={styles.header} {...panResponder.panHandlers}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>Detalle del día</Text>
              <Text style={styles.title}>{dateLabel}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          {trips.length === 0 ? (
            <Text style={styles.emptyText}>Todavía no hay viajes.</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.tripList} showsVerticalScrollIndicator={false}>
              {trips.map((trip, index) => (
                <View key={trip.id} style={styles.tripCard}>
                  <View style={styles.tripHeader}>
                    <View style={styles.tripTitleGroup}>
                      <TripStamp mode={trip.mode} />
                      <Text style={styles.tripTitle}>
                        Viaje {index + 1}
                        {trip.mode === 'special' && trip.specialType ? ` - ${trip.specialType}` : ''}
                      </Text>
                    </View>

                    <View style={styles.timeField}>
                      <Text style={styles.inputLabel}>Hora</Text>
                      <TextInput
                        inputMode="numeric"
                        maxLength={5}
                        onChangeText={(time) => onUpdateTrip(trip.id, { time })}
                        placeholder="HH:mm"
                        style={styles.timeInput}
                        value={trip.time}
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Tipo</Text>
                  <View style={styles.modeRow}>
                    {modeOptions.map((mode) => {
                      const isSelected = trip.mode === mode;

                      return (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          key={mode}
                          onPress={() => handleModeChange(trip, mode)}
                          style={[styles.modeButton, isSelected && styles.selectedModeButton]}
                        >
                          <Text style={[styles.modeText, isSelected && styles.selectedModeText]}>
                            {tripLabels[mode]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {trip.mode === 'special' ? (
                    <>
                      <Text style={styles.inputLabel}>Detalle especial</Text>
                      <TextInput
                        onChangeText={(specialType) => onUpdateTrip(trip.id, { specialType })}
                        placeholder="Parada extra, desvío..."
                        style={styles.input}
                        value={trip.specialType ?? ''}
                      />
                    </>
                  ) : null}

                  {openNoteEditors[trip.id] ? (
                    <View style={styles.noteEditor}>
                      <TextInput
                        multiline
                        onChangeText={(note) =>
                          setNoteDrafts((current) => ({
                            ...current,
                            [trip.id]: note,
                          }))
                        }
                        placeholder="Nota opcional"
                        style={[styles.input, styles.noteInput]}
                        value={noteDrafts[trip.id] ?? trip.note ?? ''}
                      />

                      <View style={styles.noteActionsRow}>
                        <Pressable
                          accessibilityLabel="Cancelar nota"
                          accessibilityRole="button"
                          onPress={() => cancelNote(trip.id)}
                          style={({ pressed }) => [styles.noteActionButton, pressed && styles.iconActionButtonPressed]}
                        >
                          <Ionicons name="close-circle-outline" size={18} color="#8D5B08" />
                          <Text style={styles.noteActionText}>Cancelar</Text>
                        </Pressable>

                        <Pressable
                          accessibilityLabel="Guardar nota"
                          accessibilityRole="button"
                          onPress={() => saveNote(trip.id)}
                          style={({ pressed }) => [styles.noteActionButton, styles.noteActionPrimary, pressed && styles.iconActionButtonPressed]}
                        >
                          <Ionicons name="checkmark-circle-outline" size={18} color="#247145" />
                          <Text style={[styles.noteActionText, styles.noteActionPrimaryText]}>Guardar</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  <View style={styles.actionsRow}>
                    <Pressable
                      accessibilityLabel="Agregar nota"
                      accessibilityRole="button"
                      onPress={() => toggleNoteEditor(trip.id)}
                      style={({ pressed }) => [styles.iconActionButton, pressed && styles.iconActionButtonPressed]}
                    >
                      <Ionicons
                        name={openNoteEditors[trip.id] ? 'chatbox-ellipses' : 'create-outline'}
                        size={18}
                        color="#247145"
                      />
                    </Pressable>

                    <Pressable
                      accessibilityLabel="Borrar viaje"
                      accessibilityRole="button"
                      onPress={() => confirmDeleteTrip(trip)}
                      style={({ pressed }) => [styles.iconActionButton, pressed && styles.iconActionButtonPressed]}
                    >
                      <Ionicons name="trash-outline" size={18} color="#B63A34" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
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
    maxHeight: '82%',
    padding: 18,
    paddingBottom: 24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
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
    gap: 12,
    paddingBottom: 4,
  },
  tripCard: {
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1EAE3',
    borderRadius: 8,
    backgroundColor: '#FBFDFB',
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  tripTitleGroup: {
    flex: 1,
    gap: 7,
  },
  tripTitle: {
    color: '#354039',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  timeField: {
    width: 76,
  },
  inputLabel: {
    color: '#59675D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  timeInput: {
    minHeight: 38,
    marginTop: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DDE7DF',
    borderRadius: 7,
    color: '#253229',
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: '#FFFFFF',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modeButton: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#DDE7DF',
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
  },
  selectedModeButton: {
    borderColor: '#65A878',
    backgroundColor: '#EAF7EE',
  },
  modeText: {
    color: '#58665B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  selectedModeText: {
    color: '#247145',
  },
  input: {
    minHeight: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DDE7DF',
    borderRadius: 7,
    color: '#253229',
    backgroundColor: '#FFFFFF',
  },
  noteInput: {
    minHeight: 64,
    paddingTop: 9,
    textAlignVertical: 'top',
  },
  noteEditor: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FBF8',
    borderWidth: 1,
    borderColor: '#E3EDE6',
  },
  noteActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  noteActionButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE7DF',
  },
  noteActionPrimary: {
    backgroundColor: '#EAF7EE',
    borderColor: '#CDE7D5',
  },
  noteActionText: {
    color: '#4A5A50',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  noteActionPrimaryText: {
    color: '#247145',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  iconActionButton: {
    minHeight: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: '#EFF4F0',
  },
  iconActionButtonPressed: {
    opacity: 0.85,
  },
});
