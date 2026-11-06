import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import type { Route } from '../../../services/types';
import { CreateDayTripInput, Trip, TripUpdates } from '../types';
import { TripCard, TripDraft } from './TripCard';
import { Theme, useTheme, useThemedStyles } from '../../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { confirmAction } from '../../../utils/confirmAction';

type DayDetailsModalProps = {
  visible: boolean;
  dateLabel: string;
  trips: Trip[];
  routes?: Route[];
  defaultRouteName?: string;
  defaultRouteId?: string;
  onClose: () => void;
  onUpdateTrip: (tripId: string, updates: TripUpdates) => void;
  onDeleteTrip: (tripId: string) => void;
  onCreateTrip?: (input: CreateDayTripInput) => void;
  canCreateRegularTrips?: boolean;
  canCreateSpecialTrips?: boolean;
  canSetPrice?: boolean;
  canDeleteTrips?: boolean;
  canMarkPaid?: boolean;
  onMarkTripPaid?: (tripId: string) => void;
  readOnly?: boolean;
};

const NEW_TRIP_ID = '__new__';
const SWIPE_CLOSE_DISTANCE = 120;
const SWIPE_CLOSE_VELOCITY = 1;
const PANEL_EXIT_TRANSLATE_Y = 520;
const NOOP = () => {};

export function DayDetailsModal({
  visible,
  dateLabel,
  trips,
  routes = [],
  defaultRouteName = '',
  defaultRouteId = '',
  onClose,
  onUpdateTrip,
  onDeleteTrip,
  onCreateTrip,
  canCreateRegularTrips = false,
  canCreateSpecialTrips = false,
  canSetPrice = false,
  canDeleteTrips = false,
  canMarkPaid = false,
  onMarkTripPaid,
  readOnly = false,
}: DayDetailsModalProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<TripDraft | null>(null);

  const routeById = useMemo(() => {
    const map = new Map<string, string>();
    routes.forEach((route) => map.set(route.id, route.name || 'Ruta'));
    return map;
  }, [routes]);

  const getRouteLabel = (trip: Trip) => {
    if (trip.mode === 'special') {
      return trip.specialType || 'Viaje especial';
    }
    return trip.routeId ? routeById.get(trip.routeId) || 'Ruta' : 'Ruta';
  };

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
    setEditingId(null);
    setDraft(null);
  }, [translateY, visible]);

  const closeWithSwipeAnimation = useCallback(() => {
    Animated.timing(translateY, {
      toValue: PANEL_EXIT_TRANSLATE_Y,
      duration: 170,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        onClose();
      }
    });
  }, [onClose, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const vertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
          return vertical && gestureState.dy > 4;
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
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        },
      }),
    [closeWithSwipeAnimation, translateY],
  );

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const handleChangeDraft = (patch: Partial<TripDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const startEdit = (trip: Trip) => {
    if (readOnly) {
      return;
    }

    setEditingId(trip.id);
    setDraft({
      mode: trip.mode,
      time: trip.time,
      specialType: trip.specialType ?? '',
      note: trip.note ?? '',
      price: '',
      paid: trip.paymentStatus === 'paid',
      routeId: trip.routeId ?? defaultRouteId,
    });
  };

  const startCreate = () => {
    if (!onCreateTrip) {
      return;
    }

    setEditingId(NEW_TRIP_ID);
    setDraft({
      mode: canCreateRegularTrips ? 'outbound' : 'special',
      time: new Date().toTimeString().slice(0, 5),
      specialType: '',
      note: '',
      price: '',
      paid: false,
      routeId: defaultRouteId,
    });
  };

  const saveDraft = () => {
    if (!draft) {
      return;
    }

    if (editingId === NEW_TRIP_ID) {
      onCreateTrip?.({
        mode: draft.mode,
        time: draft.time.trim() || undefined,
        specialType:
          draft.mode === 'special'
            ? draft.specialType.trim() || 'Ruta especial'
            : undefined,
        note: draft.note.trim() || undefined,
        price:
          draft.mode === 'special' && canSetPrice
            ? draft.price.trim() || undefined
            : undefined,
        routeId: draft.mode === 'special' ? undefined : draft.routeId || undefined,
        markAsPaid: draft.paid || undefined,
      });
      cancelEdit();
      return;
    }

    const trip = trips.find((currentTrip) => currentTrip.id === editingId);
    if (!trip) {
      cancelEdit();
      return;
    }

    onUpdateTrip(trip.id, {
      time: draft.time.trim() || trip.time,
      mode: draft.mode,
      note: draft.note.trim(),
      routeId:
        draft.mode === 'special' ? undefined : defaultRouteId || undefined,
      specialType:
        draft.mode === 'special'
          ? draft.specialType.trim() || 'Ruta especial'
          : undefined,
    });

    if (draft.paid && trip.paymentStatus !== 'paid') {
      onMarkTripPaid?.(trip.id);
    }

    cancelEdit();
  };

  const confirmDeleteTrip = (trip: Trip) => {
    confirmAction(
      'Eliminar viaje',
      '¿Eliminar este viaje?',
      () => onDeleteTrip(trip.id),
      'Eliminar',
    );
  };

  const isCreating = editingId === NEW_TRIP_ID;
  const canShowAdd = Boolean(onCreateTrip) && (canCreateRegularTrips || canCreateSpecialTrips);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[styles.panel, { paddingBottom: insets.bottom + 18, transform: [{ translateY }] }]}
        >
          <View style={styles.dragHandleZone} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>Detalle del día</Text>
              <Text style={styles.title}>{dateLabel}</Text>
            </View>

            {canShowAdd ? (
              <Pressable
                accessibilityLabel="Agregar viaje"
                accessibilityRole="button"
                onPress={startCreate}
                style={styles.addButton}
              >
                <AppIcon name="plus" size={20} color={theme.colors.textInverse} />
              </Pressable>
            ) : null}
          </View>

          {trips.length === 0 && !isCreating ? (
            <Text style={styles.emptyText}>Todavía no hay viajes.</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.tripList} showsVerticalScrollIndicator={false}>
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  routeLabel={getRouteLabel(trip)}
                  isEditing={editingId === trip.id}
                  draft={editingId === trip.id ? draft : null}
                  isNew={false}
                  readOnly={readOnly}
                  canDelete={canDeleteTrips}
                  canMarkPaid={canMarkPaid}
                  canSetPrice={canSetPrice}
                  onChangeDraft={handleChangeDraft}
                  onToggleEdit={() => startEdit(trip)}
                  onDelete={() => confirmDeleteTrip(trip)}
                  onCancel={cancelEdit}
                  onSave={saveDraft}
                />
              ))}

              {isCreating && draft ? (
                <TripCard
                  draft={draft}
                  isEditing
                  isNew
                  routeLabel={defaultRouteName || 'Ruta actual'}
                  routes={routes}
                  readOnly={readOnly}
                  canDelete={false}
                  canMarkPaid={canMarkPaid}
                  canSetPrice={canSetPrice}
                  onChangeDraft={handleChangeDraft}
                  onToggleEdit={NOOP}
                  onDelete={NOOP}
                  onCancel={cancelEdit}
                  onSave={saveDraft}
                />
              ) : null}
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
    paddingHorizontal: 18,
    paddingTop: 8,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: theme.colors.surface,
  },
  dragHandleZone: {
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingTop: 12,
    paddingBottom: 16,
  },
  dragHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.borderStrong,
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
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
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
});
