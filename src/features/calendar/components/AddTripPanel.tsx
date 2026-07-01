import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppIcon } from '../../../components/AppIcon';
import type { Route } from '../../../services/types';
import { Theme, useTheme, useThemedStyles } from '../../../theme';
import { TripMode } from '../types';

type TripTypeOption = {
  mode: TripMode;
  label: string;
};

type AddTripPanelProps = {
  isOpen: boolean;
  selectedMode: TripMode;
  onSelectMode: (mode: TripMode) => void;
  routeId: string;
  routes: Route[];
  onSelectRoute: (routeId: string) => void;
  canCreateRegularTrips?: boolean;
  canCreateSpecialTrips?: boolean;
};

export function AddTripPanel({
  isOpen,
  selectedMode,
  onSelectMode,
  routeId,
  routes,
  onSelectRoute,
  canCreateRegularTrips = true,
  canCreateSpecialTrips = true,
}: AddTripPanelProps) {
  const allTripTypeOptions: TripTypeOption[] = [
    { mode: 'outbound', label: 'Ida' },
    { mode: 'roundTrip', label: 'Ida y vuelta' },
    { mode: 'special', label: 'Especial' },
  ];

  const tripTypeOptions = useMemo(() => {
    return allTripTypeOptions.filter((option) => {
      if (option.mode === 'special') {
        return canCreateSpecialTrips;
      }
      return canCreateRegularTrips;
    });
  }, [canCreateRegularTrips, canCreateSpecialTrips]);

  useEffect(() => {
    const isSelectedAvailable = tripTypeOptions.some((option) => option.mode === selectedMode);
    if (!isSelectedAvailable && tripTypeOptions.length > 0) {
      onSelectMode(tripTypeOptions[0].mode);
    }
  }, [tripTypeOptions, selectedMode, onSelectMode]);
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [routeModalVisible, setRouteModalVisible] = useState(false);

  const isRouteSelectorDisabled = selectedMode === 'special';

  const routeOptions = useMemo(() => {
    return routes.map((route) => ({
      id: route.id,
      label: route.name || 'Ruta',
    }));
  }, [routes]);

  const selectedRouteLabel = useMemo(() => {
    if (!routeId) {
      return '— Elegir ruta —';
    }

    return routeOptions.find((option) => option.id === routeId)?.label ?? '— Elegir ruta —';
  }, [routeId, routeOptions]);

  const hintText = useMemo(() => {
    if (selectedMode === 'special') {
      return 'Tocá un día para completar el detalle';
    }

    if (!routeId) {
      return 'Elegí una ruta para poder crear viajes';
    }

    return 'Elegí la ruta y tocá los días';
  }, [selectedMode, routeId]);

  const handleSelectRoute = (id: string) => {
    onSelectRoute(id);
    setRouteModalVisible(false);
  };

  return (
    <React.Fragment>
      <View style={[styles.panel, isOpen && styles.panelOpen]}>
        <View style={styles.panelInner}>
          <View style={styles.divider} />

          <View style={styles.pillsRow}>
            {tripTypeOptions.map((option) => {
              const isActive = option.mode === selectedMode;

              return (
                <Pressable
                  key={option.mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => onSelectMode(option.mode)}
                  style={({ pressed }) => [
                    styles.pill,
                    isActive && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                    pressed && !isActive && styles.pillPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillLabel,
                      isActive && { color: theme.colors.textInverse },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isRouteSelectorDisabled }}
            disabled={isRouteSelectorDisabled}
            onPress={() => setRouteModalVisible(true)}
            style={({ pressed }) => [
              styles.routeSelector,
              isRouteSelectorDisabled && styles.routeSelectorDisabled,
              pressed && !isRouteSelectorDisabled && styles.routeSelectorPressed,
            ]}
          >
            <Text
              style={[
                styles.routeSelectorLabel,
                isRouteSelectorDisabled && styles.routeSelectorLabelDisabled,
                !routeId && styles.routeSelectorPlaceholder,
              ]}
              numberOfLines={1}
            >
              {selectedRouteLabel}
            </Text>
            <AppIcon
              name="chevronDown"
              size={16}
              color={isRouteSelectorDisabled ? theme.colors.disabled : theme.colors.primary}
            />
          </Pressable>

          <Text style={styles.hint}>{hintText}</Text>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={routeModalVisible}
        onRequestClose={() => setRouteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setRouteModalVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar ruta</Text>
              <Pressable
                onPress={() => setRouteModalVisible(false)}
                style={styles.modalClose}
                accessibilityRole="button"
                accessibilityLabel="Cerrar selector"
              >
                <AppIcon name="close" size={20} color={theme.colors.primary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {routeOptions.map((option) => {
                const isSelected = option.id === routeId;

                return (
                  <Pressable
                    key={option.id}
                    style={({ pressed }) => [
                      styles.routeRow,
                      isSelected && styles.routeRowSelected,
                      pressed && styles.routeRowPressed,
                    ]}
                    onPress={() => handleSelectRoute(option.id)}
                  >
                    <Text
                      style={[
                        styles.routeRowText,
                        isSelected && styles.routeRowTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected ? <AppIcon name="check" size={18} color={theme.colors.primary} /> : null}
                  </Pressable>
                );
              })}

              {routeOptions.length === 0 ? (
                <Text style={styles.modalEmpty}>No hay rutas disponibles</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </React.Fragment>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  panel: {
    overflow: 'hidden',
    maxHeight: 0,
    opacity: 0,
  },
  panelOpen: {
    maxHeight: 220,
    opacity: 1,
  },
  panelInner: {
    paddingTop: 12,
  },
  divider: {
    height: 0.5,
    backgroundColor: theme.colors.border,
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: theme.colors.borderStrong,
    backgroundColor: 'transparent',
  },
  pillPressed: {
    backgroundColor: theme.colors.primaryLight,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  routeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    paddingRight: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: theme.colors.borderStrong,
    backgroundColor: theme.colors.surface,
  },
  routeSelectorDisabled: {
    opacity: 0.45,
    backgroundColor: theme.colors.surfaceMuted,
  },
  routeSelectorPressed: {
    borderColor: theme.colors.primary,
  },
  routeSelectorLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  routeSelectorLabelDisabled: {
    color: theme.colors.textSubtle,
  },
  routeSelectorPlaceholder: {
    color: theme.colors.textSubtle,
  },
  hint: {
    marginTop: 5,
    minHeight: 15,
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.overlay,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 18,
    maxHeight: '62%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceMuted,
  },
  routeRow: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceMuted,
  },
  routeRowSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  routeRowPressed: {
    opacity: 0.8,
  },
  routeRowText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  routeRowTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  modalEmpty: {
    color: theme.colors.textSubtle,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
