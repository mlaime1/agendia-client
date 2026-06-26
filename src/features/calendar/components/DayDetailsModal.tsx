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

import { AppIcon } from '../../../components/AppIcon';
import { Trip, TripMode, TripUpdates } from '../types';
import { TripStamp } from './TripStamp';
import { Theme, useTheme, useThemedStyles } from '../../../theme';

type DayDetailsModalProps = {
  visible: boolean;
  dateLabel: string;
  trips: Trip[];
  onClose: () => void;
  onUpdateTrip: (tripId: string, updates: TripUpdates) => void;
  onDeleteTrip: (tripId: string) => void;
  readOnly?: boolean;
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
  readOnly = false,
}: DayDetailsModalProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
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

                    {!readOnly && (
                      <View style={styles.timeField}>
                        <Text style={styles.inputLabel}>Hora</Text>
                        <TextInput
                          inputMode="numeric"
                          maxLength={5}
                          onChangeText={(time) => onUpdateTrip(trip.id, { time })}
                          placeholder="HH:mm"
                          placeholderTextColor={theme.colors.textSubtle}
                          style={styles.timeInput}
                          value={trip.time}
                        />
                      </View>
                    )}
                  </View>

                  {!readOnly && (
                    <>
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
                    </>
                  )}

                  {trip.mode === 'special' && !readOnly ? (
                    <>
                      <Text style={styles.inputLabel}>Detalle especial</Text>
                      <TextInput
                        onChangeText={(specialType) => onUpdateTrip(trip.id, { specialType })}
                        placeholder="Parada extra, desvío..."
                        placeholderTextColor={theme.colors.textSubtle}
                        style={styles.input}
                        value={trip.specialType ?? ''}
                      />
                    </>
                  ) : null}

                  {trip.mode === 'special' && readOnly && trip.specialType ? (
                    <Text style={styles.specialTypeLabel}>{trip.specialType}</Text>
                  ) : null}

                  {!readOnly && openNoteEditors[trip.id] ? (
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
                        placeholderTextColor={theme.colors.textSubtle}
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
                          <AppIcon name="closeCircle" size={18} color={theme.colors.semantic.warning.text} />
                          <Text style={styles.noteActionText}>Cancelar</Text>
                        </Pressable>

                        <Pressable
                          accessibilityLabel="Guardar nota"
                          accessibilityRole="button"
                          onPress={() => saveNote(trip.id)}
                          style={({ pressed }) => [styles.noteActionButton, styles.noteActionPrimary, pressed && styles.iconActionButtonPressed]}
                        >
                          <AppIcon name="checkCircle" size={18} color={theme.colors.primary} />
                          <Text style={[styles.noteActionText, styles.noteActionPrimaryText]}>Guardar</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {readOnly && trip.note ? (
                    <Text style={styles.noteDisplay}>{trip.note}</Text>
                  ) : null}

                  {!readOnly && (
                    <View style={styles.actionsRow}>
                      <Pressable
                        accessibilityLabel="Agregar nota"
                        accessibilityRole="button"
                        onPress={() => toggleNoteEditor(trip.id)}
                        style={({ pressed }) => [styles.iconActionButton, pressed && styles.iconActionButtonPressed]}
                      >
                        <AppIcon
                          name={openNoteEditors[trip.id] ? 'message' : 'edit'}
                          size={18}
                          color={theme.colors.primary}
                        />
                      </Pressable>

                      <Pressable
                        accessibilityLabel="Borrar viaje"
                        accessibilityRole="button"
                        onPress={() => confirmDeleteTrip(trip)}
                        style={({ pressed }) => [styles.iconActionButton, pressed && styles.iconActionButtonPressed]}
                      >
                        <AppIcon name="trash" size={18} color={theme.colors.danger} />
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  panel: {
    maxHeight: '82%',
    padding: 18,
    paddingBottom: 24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 2,
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0,
  },
  closeButton: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceMuted,
  },
  closeText: {
    color: theme.colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0,
  },
  emptyText: {
    color: theme.colors.textSubtle,
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
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceSubtle,
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
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  timeField: {
    width: 76,
  },
  inputLabel: {
    color: theme.colors.textMuted,
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
    borderColor: theme.colors.borderStrong,
    borderRadius: 7,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: theme.colors.surface,
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
    borderColor: theme.colors.borderStrong,
    borderRadius: 7,
    backgroundColor: theme.colors.surface,
  },
  selectedModeButton: {
    borderColor: theme.colors.trip.outbound.border,
    backgroundColor: theme.colors.trip.outbound.bg,
  },
  modeText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  selectedModeText: {
    color: theme.colors.primary,
  },
  input: {
    minHeight: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: 7,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
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
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  noteActionPrimary: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.borderStrong,
  },
  noteActionText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  noteActionPrimaryText: {
    color: theme.colors.primary,
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
    backgroundColor: theme.colors.surfaceMuted,
  },
  iconActionButtonPressed: {
    opacity: 0.85,
  },
  specialTypeLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0,
    paddingVertical: 8,
  },
  noteDisplay: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    paddingVertical: 8,
  },
});
