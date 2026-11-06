import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppIcon, AppIconName } from '../../../components/AppIcon';
import { Theme, useTheme, useThemedStyles } from '../../../theme';
import type { Route } from '../../../services/types';
import { Trip, TripMode } from '../types';

export type TripDraft = {
  mode: TripMode;
  time: string;
  specialType: string;
  note: string;
  price: string;
  paid: boolean;
  routeId: string;
};

type TripCardProps = {
  trip?: Trip;
  routeLabel: string;
  routes?: Route[];
  isEditing: boolean;
  draft: TripDraft | null;
  isNew: boolean;
  readOnly: boolean;
  canDelete: boolean;
  canMarkPaid: boolean;
  canSetPrice: boolean;
  onChangeDraft: (patch: Partial<TripDraft>) => void;
  onToggleEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
};

const tripLabels: Record<TripMode, string> = {
  outbound: 'Ida',
  roundTrip: 'Ida y vuelta',
  special: 'Especial',
};

const modeOptions: TripMode[] = ['outbound', 'roundTrip', 'special'];

const modeIcons: Record<TripMode, AppIconName> = {
  outbound: 'arrowRight',
  roundTrip: 'arrowsLeftRight',
  special: 'star',
};

export function TripCard({
  trip,
  routeLabel,
  routes = [],
  isEditing,
  draft,
  isNew,
  readOnly,
  canDelete,
  canMarkPaid,
  canSetPrice,
  onChangeDraft,
  onToggleEdit,
  onDelete,
  onCancel,
  onSave,
}: TripCardProps) {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [routePickerOpen, setRoutePickerOpen] = useState(false);

  const canPickRoute = isNew && routes.length > 1;
  const selectedRouteLabel =
    (draft?.routeId && routes.find((route) => route.id === draft.routeId)?.name) || routeLabel;

  if (isEditing && draft) {
    return (
      <View style={styles.card}>
        <Modal
          animationType="fade"
          onRequestClose={() => setRoutePickerOpen(false)}
          transparent
          visible={routePickerOpen}
        >
          <View style={styles.pickerBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setRoutePickerOpen(false)} />
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Elegí la ruta</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {routes.map((route) => {
                const isSelected = draft.routeId === route.id;

                return (
                  <Pressable
                    accessibilityLabel={route.name || 'Ruta'}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    key={route.id}
                    onPress={() => {
                      onChangeDraft({ routeId: route.id });
                      setRoutePickerOpen(false);
                    }}
                    style={[styles.pickerOption, isSelected && styles.pickerOptionActive]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.pickerOptionText,
                        isSelected && styles.pickerOptionTextActive,
                      ]}
                    >
                      {route.name || 'Ruta'}
                    </Text>
                  </Pressable>
                );
              })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {draft.mode === 'special' ? (
          <TextInput
            onChangeText={(specialType) => onChangeDraft({ specialType })}
            placeholder="Parada extra, desvío..."
            placeholderTextColor={theme.colors.textSubtle}
            style={styles.textInput}
            value={draft.specialType}
          />
        ) : (
          <Pressable
            accessibilityHint={canPickRoute ? 'Abre la lista de rutas asignadas' : undefined}
            accessibilityLabel={`Ruta: ${selectedRouteLabel}`}
            accessibilityRole={canPickRoute ? 'button' : undefined}
            disabled={!canPickRoute}
            onPress={() => setRoutePickerOpen(true)}
            style={styles.readOnlyName}
          >
            <Text numberOfLines={1} style={styles.readOnlyNameText}>
              {selectedRouteLabel}
            </Text>
            {canPickRoute ? <Text style={styles.routePickerHint}>Cambiar</Text> : null}
          </Pressable>
        )}

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <AppIcon name="clock" size={14} color={theme.colors.textSubtle} />
            <TextInput
              inputMode="numeric"
              maxLength={5}
              onChangeText={(time) => onChangeDraft({ time })}
              placeholder="HH:mm"
              placeholderTextColor={theme.colors.textSubtle}
              style={styles.timeInput}
              value={draft.time}
            />
          </View>

          <View style={styles.segmented}>
            {modeOptions.map((mode) => {
              const isSelected = draft.mode === mode;
              const palette = theme.colors.trip[mode];

              return (
                <Pressable
                  accessibilityLabel={tripLabels[mode]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={mode}
                  onPress={() => onChangeDraft({ mode })}
                  style={[
                    styles.segmentButton,
                    isSelected && {
                      backgroundColor: palette.bg,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <AppIcon
                    name={modeIcons[mode]}
                    size={16}
                    color={isSelected ? palette.text : theme.colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <TextInput
          multiline
          onChangeText={(note) => onChangeDraft({ note })}
          placeholder="Nota opcional"
          placeholderTextColor={theme.colors.textSubtle}
          style={[styles.textInput, styles.noteInput]}
          value={draft.note}
        />

        {isNew && draft.mode === 'special' && canSetPrice ? (
          <TextInput
            inputMode="decimal"
            onChangeText={(price) => onChangeDraft({ price })}
            placeholder="0.00"
            placeholderTextColor={theme.colors.textSubtle}
            style={styles.textInput}
            value={draft.price}
          />
        ) : null}

        <View style={styles.actionsRow}>
          <View style={styles.payGroup}>
            {trip?.paymentStatus === 'paid' ? (
              <View style={styles.paidLabel}>
                <AppIcon name="check" size={14} color={theme.colors.trip.outbound.text} />
                <Text style={styles.paidLabelText}>Pagado</Text>
              </View>
            ) : canMarkPaid ? (
              <Pressable
                accessibilityLabel={draft.paid ? 'Pagado' : 'Marcar pago'}
                accessibilityRole="button"
                onPress={() => onChangeDraft({ paid: !draft.paid })}
                style={[styles.payButton, draft.paid && styles.payButtonActive]}
              >
                <AppIcon
                  name={draft.paid ? 'check' : 'coin'}
                  size={14}
                  color={draft.paid ? theme.colors.trip.outbound.text : theme.colors.textMuted}
                />
                <Text style={[styles.payButtonText, draft.paid && styles.payButtonTextActive]}>
                  {draft.paid ? 'Pagado' : 'Marcar pago'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            accessibilityLabel="Cancelar"
            accessibilityRole="button"
            onPress={onCancel}
            style={styles.iconButton}
          >
            <AppIcon name="close" size={18} color={theme.colors.danger} />
          </Pressable>

          <Pressable
            accessibilityLabel="Guardar"
            accessibilityRole="button"
            onPress={onSave}
            style={[styles.iconButton, styles.saveButton]}
          >
            <AppIcon name="check" size={18} color={theme.colors.textInverse} />
          </Pressable>
        </View>
      </View>
    );
  }

  if (!trip) {
    return null;
  }

  const palette = theme.colors.trip[trip.mode];
  const isPaid = trip.paymentStatus === 'paid';

  return (
    <View style={styles.card}>
      <View style={styles.collapsedRow}>
        <View
          style={[
            styles.iconTile,
            { backgroundColor: palette.bg, borderColor: palette.border },
          ]}
        >
          <AppIcon name={modeIcons[trip.mode]} size={18} color={palette.text} />
        </View>

        <View style={styles.collapsedText}>
          <Text numberOfLines={1} style={styles.title}>
            {routeLabel}
          </Text>
          <View style={styles.subtitleRow}>
            <AppIcon name="clock" size={12} color={theme.colors.textSubtle} />
            <Text style={styles.subtitle}>
              {trip.time} · {tripLabels[trip.mode]}
            </Text>
            {isPaid ? <Text style={styles.paidText}> · Pagado</Text> : null}
          </View>
        </View>

        {!readOnly ? (
          <React.Fragment>
            <Pressable
              accessibilityLabel="Editar viaje"
              accessibilityRole="button"
              onPress={onToggleEdit}
              style={styles.iconButton}
            >
              <AppIcon name="edit" size={18} color={theme.colors.primary} />
            </Pressable>

            {canDelete ? (
              <Pressable
                accessibilityLabel="Eliminar viaje"
                accessibilityRole="button"
                onPress={onDelete}
                style={styles.iconButton}
              >
                <AppIcon name="trash" size={18} color={theme.colors.danger} />
              </Pressable>
            ) : null}
          </React.Fragment>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      gap: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceSubtle,
    },
    collapsedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconTile: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderRadius: 10,
    },
    collapsedText: {
      flex: 1,
      gap: 3,
    },
    title: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0,
    },
    subtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    subtitle: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0,
    },
    paidText: {
      color: theme.colors.trip.outbound.text,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0,
    },
    iconButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 999,
      backgroundColor: theme.colors.surfaceMuted,
    },
    readOnlyName: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      borderRadius: 7,
      backgroundColor: theme.colors.surfaceMuted,
    },
    routePickerHint: {
      marginLeft: 'auto',
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '800',
    },
    pickerBackdrop: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: theme.colors.overlay,
    },
    pickerCard: {
      width: '100%',
      maxWidth: 340,
      maxHeight: '70%',
      padding: 16,
      gap: 8,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    pickerTitle: {
      marginBottom: 4,
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    pickerOption: {
      minHeight: 44,
      justifyContent: 'center',
      marginBottom: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      borderRadius: 9,
      backgroundColor: theme.colors.surface,
    },
    pickerOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceMuted,
    },
    pickerOptionText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    pickerOptionTextActive: {
      fontWeight: '800',
    },
    readOnlyNameText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0,
    },
    textInput: {
      minHeight: 40,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      borderRadius: 7,
      color: theme.colors.text,
      backgroundColor: theme.colors.surface,
    },
    noteInput: {
      minHeight: 60,
      paddingTop: 9,
      textAlignVertical: 'top',
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timeField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 40,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      borderRadius: 7,
      backgroundColor: theme.colors.surface,
      flexShrink: 0,
    },
    timeInput: {
      width: 58,
      paddingVertical: 0,
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0,
    },
    segmented: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
    },
    segmentButton: {
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      borderRadius: 7,
      backgroundColor: theme.colors.surface,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    payGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    payButton: {
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.borderStrong,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
    },
    payButtonActive: {
      borderColor: theme.colors.trip.outbound.border,
      backgroundColor: theme.colors.trip.outbound.bg,
    },
    payButtonText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0,
    },
    payButtonTextActive: {
      color: theme.colors.trip.outbound.text,
    },
    paidLabel: {
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
    },
    paidLabelText: {
      color: theme.colors.trip.outbound.text,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0,
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
    },
  });
